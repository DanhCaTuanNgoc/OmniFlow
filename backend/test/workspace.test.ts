import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { once } from 'node:events';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { parseSiweMessage } from 'viem/siwe';
import { concatHex, encodeFunctionData, keccak256, parseAbi, zeroHash, type Address } from 'viem';
import { WebSocket } from 'ws';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';
import { DeploymentStore, DeploymentConflict, deploymentEnvironment } from '../src/data/deployments.js';
import { matchesDelegatedPolicyCall } from '../src/services/deploymentSteps.js';
import { WorkspaceSessionService } from '../src/services/workspaceSession.service.js';

const alice = privateKeyToAccount(generatePrivateKey());
const bob = privateKeyToAccount(generatePrivateKey());

test('delegated Vault step requires the exact target, calldata and single-call mode', () => {
  const manager = '0xdb9b1e94b5b69df7e401ddbede43491141047db3';
  const abi = parseAbi(['function redeemDelegations(bytes[],bytes32[],bytes[])']);
  const expected = '0x12345678';
  const call = concatHex([alice.address, zeroHash, expected]);
  const input = encodeFunctionData({ abi, functionName: 'redeemDelegations', args: [['0x01'], [zeroHash], [call]] });
  assert.equal(matchesDelegatedPolicyCall(manager, input, alice.address, expected), true);
  assert.equal(matchesDelegatedPolicyCall(manager, input, bob.address, expected), false);
  assert.equal(matchesDelegatedPolicyCall(manager, input, alice.address, '0x12345679'), false);
  assert.equal(matchesDelegatedPolicyCall(bob.address, input, alice.address, expected), false);
});

test('Take-Profit preparation pins the wallet, draft, graph and funding across retries', () => {
  const store = new DeploymentStore(':memory:');
  try {
    const owner = alice.address.toLowerCase() as Address;
    const expected = { draftId: 'first-draft', graphJson: '{"name":"first"}', fundingWei: '200' };
    assert.deepEqual(store.prepareTakeProfit(owner, 'attempt', 'first-draft', expected.graphJson, 200n), expected);
    assert.deepEqual(store.prepareTakeProfit(owner, 'attempt', 'other-draft', '{}', 300n), expected);
    assert.equal(store.getTakeProfitPreparation(bob.address.toLowerCase() as Address, 'attempt'), undefined);
  } finally {
    store.close();
  }
});

test('linked Vaults are wallet and chain scoped and retain their verified kind', () => {
  const store = new DeploymentStore(':memory:');
  try {
    const link = {
      owner: alice.address,
      address: '0x0000000000000000000000000000000000000001',
      pair: '0x0000000000000000000000000000000000000002',
      router: '0x0000000000000000000000000000000000000003',
      quote: '0x0000000000000000000000000000000000000004',
      proxy: '0x0000000000000000000000000000000000000005',
      chainId: 84532,
    } as const;
    store.linkVault(link);
    assert.equal(store.listVaultLinks(alice.address, 84532)[0].kind, null);
    store.linkVault({ ...link, kind: 'price-order' });
    store.linkVault(link);
    assert.deepEqual(store.listVaultLinks(alice.address, 84532), [
      { address: link.address, pair: link.pair, kind: 'price-order' },
    ]);
    assert.deepEqual(store.listVaultLinks(bob.address, 84532), []);
    assert.deepEqual(store.listVaultLinks(alice.address, 5318007), []);
  } finally {
    store.close();
  }
});

test('SIWE binds the challenge to its origin and wallet, consumes it once, and expires the session', async () => {
  let now = Date.now();
  const service = new WorkspaceSessionService(() => now);
  const challenge = service.createChallenge(alice.address)!;
  const parsed = parseSiweMessage(challenge.message);
  assert.equal(parsed.domain, new URL(env.WORKSPACE_ORIGIN).host);
  assert.equal(parsed.uri, env.WORKSPACE_ORIGIN);
  assert.equal(parsed.chainId, 84532);
  assert.equal(parsed.nonce, challenge.nonce);
  assert.equal(await service.verify(challenge.nonce, await bob.signMessage(challenge)), undefined);

  const signature = await alice.signMessage(challenge);
  const attempts = await Promise.all([service.verify(challenge.nonce, signature), service.verify(challenge.nonce, signature)]);
  const sessions = attempts.filter(session => session !== undefined);
  assert.equal(sessions.length, 1);
  assert.equal(service.getSession(sessions[0].token)?.owner, alice.address);
  now = sessions[0].expiresAt;
  assert.equal(service.getSession(sessions[0].token), undefined);

  const expired = service.createChallenge(alice.address)!;
  now = expired.expiresAt;
  assert.equal(await service.verify(expired.nonce, await alice.signMessage(expired)), undefined);
  service.close();
});

test('SIWE nonce consumption, expiry and revocation survive a database reopen', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'omniflow-session-'));
  const path = join(dir, 'workspace.sqlite');
  let service = new WorkspaceSessionService(Date.now, path);
  try {
    const challenge = service.createChallenge(alice.address)!;
    const signature = await alice.signMessage(challenge);
    service.close();
    service = new WorkspaceSessionService(Date.now, path);
    const session = await service.verify(challenge.nonce, signature);
    assert.ok(session);
    service.close();
    service = new WorkspaceSessionService(Date.now, path);
    assert.equal(await service.verify(challenge.nonce, signature), undefined);
    assert.equal(service.getSession(session.token)?.owner, alice.address);
    service.revoke(session.token);
    assert.equal(service.getSession(session.token), undefined);
  } finally {
    service.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('HTTP workspace endpoints enforce the session and reject a forged deployment owner', async () => {
  const { server } = createApp();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const bound = server.address();
  assert.ok(bound && typeof bound === 'object');
  const url = `http://127.0.0.1:${bound.port}/api`;
  const key = crypto.randomUUID();
  const send = (path: string, body: object, token?: string, origin = env.WORKSPACE_ORIGIN) => fetch(url + path, {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json', 'Idempotency-Key': key,
      ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  try {
    assert.equal((await send('/pipeline/compile-and-deploy', {})).status, 401);
    assert.equal((await fetch(url + '/logs')).status, 401);
    assert.equal((await send('/session/challenge', { address: alice.address }, undefined, 'https://untrusted.example')).status, 403);
    const challenge = await (await send('/session/challenge', { address: alice.address })).json();
    const signature = await alice.signMessage({ message: challenge.message });
    const response = await send('/session/verify', { nonce: challenge.nonce, signature });
    assert.equal(response.status, 200);
    const { token } = await response.json();
    const ws = new WebSocket(`ws://127.0.0.1:${bound.port}/stream`, { origin: env.WORKSPACE_ORIGIN });
    try {
      const [hello] = await once(ws, 'message');
      assert.equal(JSON.parse(hello.toString()).type, 'CONNECTED');
      const wsSend = async (message: object) => {
        const reply = once(ws, 'message');
        ws.send(JSON.stringify(message));
        const [data] = await reply;
        return JSON.parse(data.toString());
      };
      assert.equal((await wsSend({ type: 'SUBSCRIBE_PIPELINE', pipelineId: 'all' })).type, 'ERROR');
      assert.equal((await wsSend({ type: 'AUTHENTICATE', data: { token } })).type, 'AUTHENTICATED');
      assert.equal((await wsSend({ type: 'SUBSCRIBE_PIPELINE', pipelineId: 'all' })).type, 'ERROR');
    } finally {
      const closed = once(ws, 'close');
      ws.close();
      await closed;
    }
    const nodes = ['trigger', 'action'].map(id => ({ id, type: id, position: { x: 0, y: 0 }, data: {} }));
    assert.equal((await send('/pipeline/compile-and-deploy', {
      metadata: { name: 'Another wallet', ownerAddress: bob.address },
      networks: {}, nodes, edges: [{ id: 'edge', source: 'trigger', target: 'action' }],
    }, token)).status, 403);
    assert.equal((await fetch(url + '/session', {
      method: 'DELETE', headers: { Origin: env.WORKSPACE_ORIGIN, Authorization: `Bearer ${token}` },
    })).status, 204);
    assert.equal((await fetch(url + '/pipeline/deployments', { headers: { Authorization: `Bearer ${token}` } })).status, 401);
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});

test('the deployment store keeps the same transaction and revision after restart and excludes other wallets', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'omniflow-workspace-'));
  const path = join(dir, 'workspace.sqlite');
  const owner = alice.address.toLowerCase() as Address;
  const other = bob.address.toLowerCase() as Address;
  const signedTransaction = await bob.signTransaction({
    chainId: 5318007, nonce: 5, type: 'legacy', gasPrice: 1n, gas: 21_000n, to: owner,
  });
  const input = {
    owner, key: 'original', graphJson: '{"metadata":{"name":"Stop-loss"},"graph":1}', template: 'stop-loss@1',
    environment: deploymentEnvironment, signer: other, nonce: 5, signedTransaction, txHash: keccak256(signedTransaction),
  };
  let store = new DeploymentStore(path);
  try {
    const original = store.reserve(input);
    store.close();
    store = new DeploymentStore(path);
    assert.deepEqual(store.reserve(input), original);
    assert.throws(() => store.reserve({ ...input, graphJson: '{"graph":2}' }), DeploymentConflict);
    assert.throws(() => store.reserve({ ...input, owner: other, key: 'new', nonce: 6 }), DeploymentConflict);
    assert.equal(store.owns(other, original.id), false);
    assert.deepEqual(store.list(other, deploymentEnvironment), []);
    assert.equal(store.owns(owner, original.id), true);
    assert.equal(store.setArchived(owner, original.id, true), false);
    const draft = store.getDraft(owner, original.workspacePipelineId)!;
    assert.equal(store.getDraft(other, draft.id), undefined);
    const updatedDraft = store.saveDraft(owner, draft.graphJson, 'New name', draft)!;
    assert.ok(updatedDraft);
    assert.equal(store.saveDraft(owner, draft.graphJson, 'Stale name', draft), undefined);

    const standalone = store.saveDraft(owner, draft.graphJson, 'Undeployed draft')!;
    assert.equal(store.deleteDraft(other, standalone.id), false);
    assert.equal(store.deleteDraft(owner, standalone.id, { updatedAt: standalone.updatedAt + 1 }), false);
    assert.equal(store.deleteDraft(owner, standalone.id, { updatedAt: standalone.updatedAt }), true);
    assert.equal(store.getDraft(owner, standalone.id), undefined);

    assert.equal(store.deleteDraft(owner, updatedDraft.id, { updatedAt: updatedDraft.updatedAt }), false);
    assert.equal(store.owns(owner, original.id), true);
    assert.equal(store.get(owner, deploymentEnvironment, input.key)?.graphJson, input.graphJson);
    assert.equal(store.settle(original, 'deployed', owner).rscAddress, owner);
    assert.equal(store.get(owner, deploymentEnvironment, input.key)?.status, 'deployed');
    assert.equal(store.deleteDraft(owner, updatedDraft.id), false);
    assert.equal(store.setArchived(other, original.id, true), false);
    assert.equal(store.setArchived(owner, original.id, true), true);
    const archivedAt = store.get(owner, deploymentEnvironment, input.key)?.archivedAt;
    assert.ok(archivedAt);
    assert.equal(store.setArchived(owner, original.id, true), true);
    assert.equal(store.get(owner, deploymentEnvironment, input.key)?.archivedAt, archivedAt);
    assert.equal(store.deleteDraft(owner, updatedDraft.id), false);
    const txHash = keccak256(signedTransaction);
    const entry = { deploymentId: original.id, reactiveTxHash: txHash, originTxHash: txHash, originLogIndex: 2 };
    store.ingestExecutionLogs(original.id, 101n, [entry, entry]);
    store.close();
    store = new DeploymentStore(path);
    assert.equal(store.cursor(original.id), 101n);
    assert.equal(store.get(owner, deploymentEnvironment, input.key)?.archivedAt, archivedAt);
    assert.equal(store.setArchived(owner, original.id, false), true);
    assert.equal(store.get(owner, deploymentEnvironment, input.key)?.archivedAt, null);
    assert.deepEqual(store.pendingExecutions(original.id, 5), [entry]);
    assert.equal(store.history(other, original.id).length, 0);
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
