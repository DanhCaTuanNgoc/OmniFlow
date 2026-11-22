'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { BaseError, formatEther, isAddressEqual, type Address, type EIP1193Provider, type Hash, type Hex } from 'viem';
import { getAccount, sendTransaction, switchChain, waitForTransactionReceipt } from 'wagmi/actions';
import { resolvePhaseTwo, type StopLossGraph } from '@omniflow/shared';
import { Loader2, Rocket } from 'lucide-react';
import { DeployDialog, DeploySummary } from './DeployConfirmation';
import type { DeploymentSummary } from '@/lib/deployments';
import { wagmiConfig } from '@/lib/wagmi';
import { workspaceRequest } from '@/lib/workspaceSession';

type Quote = { data: Hex; gas: string; gasPrice: string; value: string };
type DeployResponse = { transaction?: Quote; deployment?: DeploymentSummary };

class WalletPermissionRequired extends Error {}

function hasWalletError(error: unknown, code: number) {
  const matches = (cause: unknown) => typeof cause === 'object' && cause !== null && 'code' in cause && cause.code === code;
  return matches(error instanceof BaseError ? error.walk(matches) : error);
}

async function lasnaWallet(owner: Address) {
  const account = getAccount(wagmiConfig);
  if (!account.address || !isAddressEqual(account.address, owner) || account.chainId !== 5318007 || !account.connector) {
    throw new Error('Connect the Vault owner on Reactive Lasna.');
  }
  const provider = await account.connector.getProvider() as EIP1193Provider | undefined;
  if (!provider) throw new Error('Open the connected wallet and unlock it.');
  return provider;
}

export function TakeProfitDeployModal({ owner, graph, draft, onClose }: {
  owner: Address;
  graph: StopLossGraph & { metadata: { name: string; ownerAddress: Address; description?: string } };
  draft: { id: string; updatedAt: number };
  onClose: () => void;
}) {
  const [quote, setQuote] = useState<Quote>();
  const [deployment, setDeployment] = useState<DeploymentSummary>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [needsPermission, setNeedsPermission] = useState(false);
  const locked = useRef(false);
  const storageKey = `omniflow.take-profit.v1.${owner.toLowerCase()}.${draft.id}.${draft.updatedAt}`;

  async function advance() {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError(undefined);
    try {
      const saved = localStorage.getItem(storageKey);
      const attempt = saved ? JSON.parse(saved) as { key: string; hash?: Hash } : { key: crypto.randomUUID() };
      localStorage.setItem(storageKey, JSON.stringify(attempt));
      async function request(hash?: Hash) {
        return workspaceRequest<DeployResponse>(owner, '/pipeline/take-profit/deploy', {
          method: 'POST', body: JSON.stringify({ graph, draftId: draft.id, key: attempt.key, hash }),
        });
      }
      if (attempt.hash) {
        const result = await request(attempt.hash);
        setDeployment(result.deployment);
        return;
      }
      const prepared = await request();
      if (prepared.deployment) {
        setDeployment(prepared.deployment);
        return;
      }
      if (!prepared.transaction) throw new Error('Lasna deployment quote is unavailable.');
      if (!quote || JSON.stringify(quote) !== JSON.stringify(prepared.transaction)) {
        setQuote(prepared.transaction);
        return;
      }
      if (getAccount(wagmiConfig).chainId !== 5318007) {
        await switchChain(wagmiConfig, { chainId: 5318007 });
      }
      const provider = await lasnaWallet(owner);
      const accounts = await provider.request({ method: 'eth_accounts' });
      if (!accounts.some(address => isAddressEqual(address, owner))) throw new WalletPermissionRequired();
      const hash = await sendTransaction(wagmiConfig, {
        account: owner, chainId: 5318007, data: quote.data, type: 'legacy',
        gas: BigInt(quote.gas), gasPrice: BigInt(quote.gasPrice), value: BigInt(quote.value),
      });
      localStorage.setItem(storageKey, JSON.stringify({ ...attempt, hash }));
      const submitted = await request(hash);
      setDeployment(submitted.deployment);
      if (submitted.deployment?.status === 'signed') {
        await waitForTransactionReceipt(wagmiConfig, { chainId: 5318007, hash, timeout: 25_000, checkReplacement: false });
        setDeployment((await request(hash)).deployment);
      }
    } catch (err) {
      if (err instanceof WalletPermissionRequired || hasWalletError(err, 4100)) {
        setNeedsPermission(true);
        setError('MetaMask did not authorize this request. Unlock the wallet and reconnect the Vault owner on Lasna.');
      } else if (hasWalletError(err, 4001)) {
        setError('The wallet request was declined. You can try again.');
      } else {
        setError(err instanceof BaseError ? err.shortMessage : err instanceof Error ? err.message : 'Unable to deploy Take-Profit.');
      }
    } finally {
      setBusy(false);
      locked.current = false;
    }
  }

  async function reconnectWallet() {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError(undefined);
    try {
      const provider = await lasnaWallet(owner);
      await provider.request({ method: 'wallet_requestPermissions', params: [{ eth_accounts: {} }] });
      const accounts = await provider.request({ method: 'eth_accounts' });
      if (!accounts.some(address => isAddressEqual(address, owner))) {
        throw new Error('Select the Vault owner account when MetaMask asks which accounts to connect.');
      }
      setNeedsPermission(false);
    } catch (err) {
      setError(hasWalletError(err, 4001) ? 'Wallet access was declined.' :
        'Open MetaMask and connect the Vault owner to this site, then try signing again.');
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  const resolved = resolvePhaseTwo(graph);
  if (resolved.type !== 'price-order' || resolved.config.mode !== 1) return null;
  const { config } = resolved;
  const gas = quote ? `Up to ${formatEther(BigInt(quote.gas) * BigInt(quote.gasPrice))} lREACT` : 'Check deployment for estimate';
  const funding = quote ? <span className="font-semibold text-emerald-400">{formatEther(BigInt(quote.value))} lREACT</span> : 'Shown in quote';

  return (
    <DeployDialog busy={busy} onClose={onClose}
      error={error ?? (deployment?.status === 'reverted' ? 'The Lasna transaction reverted.' : undefined)}>
      <DeploySummary nodes={graph.nodes.length} edges={graph.edges.length}
        trigger={`Trigger at or above $${formatEther(config.threshold)} USD`}
        execution={<>Cooldown {config.cooldown.toString()}s &bull; Swap {config.percent}%</>}
        vault={config.vault} vaultLabel="Price Order Vault" owner={owner} gas={gas} funding={funding}
        notice="The owner wallet signs on Lasna. After the receipt is verified, open Active to register, configure and authorize the Price Order Vault on Base Sepolia."
      />
      {deployment && (
        <a className="ws-address block" href={`https://lasna.reactscan.net/tx/${deployment.contracts.rscTxHash}`}>
          View Lasna transaction
        </a>
      )}
      <div className="flex flex-wrap items-center gap-2 border-t border-[var(--ws-border)] pt-2">
        <button className="ws-button" type="button" disabled={busy} onClick={onClose}>
          {deployment ? 'Close' : 'Cancel'}
        </button>
        {needsPermission && (
          <button className="ws-button" type="button" disabled={busy} onClick={() => void reconnectWallet()}>
            Reconnect MetaMask
          </button>
        )}
        {deployment?.status === 'deployed'
          ? <Link className="ws-button ws-button-primary flex-1 justify-center" href={`/workspace/active/${deployment.pipelineId}`}>Set up Vault in Active</Link>
          : deployment?.status === 'reverted'
            ? <button className="ws-button flex-1" type="button" onClick={() => {
              localStorage.removeItem(storageKey);
              setDeployment(undefined);
              setQuote(undefined);
            }}>Start new attempt</button>
            : <button className="ws-button ws-button-primary min-h-[2.5rem] flex-1 justify-center" type="button" disabled={busy} onClick={() => void advance()}>
              {busy ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Rocket aria-hidden="true" className="size-4" />}
              {busy ? 'Working...' : deployment?.status === 'signed' ? 'Check Lasna receipt' : quote ? 'Sign on Lasna' : 'Check deployment'}
            </button>}
      </div>
    </DeployDialog>
  );
}
