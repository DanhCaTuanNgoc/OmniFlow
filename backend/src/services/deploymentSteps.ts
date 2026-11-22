import { concatHex, decodeFunctionData, encodeFunctionData, hexToBigInt, isAddressEqual, parseAbi, parseEventLogs, zeroHash, type Address, type Hash, type Hex } from 'viem';
import { ACTION_VAULT_ABI, PRICE_ORDER_VAULT_ABI, STOP_LOSS_TEMPLATE } from '@omniflow/shared';
import { deploymentStore } from '../data/deployments.js';
import { chainService } from './chain.service.js';
import { deployerService, resolveTakeProfit, takeProfitTemplate } from './deployer.service.js';
import { PRICE_ORDER_VAULT_RUNTIME, VAULT_RUNTIME } from '../abis/runtimeFingerprints.js';
import { matchesRuntime } from './runtimeBytecode.js';

export const deploymentSteps = ['register-rsc', 'price-policy', 'authorization', 'principal', 'callback-reserve', 'reactive-reserve'] as const;
type StepKind = typeof deploymentSteps[number];
const reserveAbi = parseAbi(['function depositTo(address) payable']);

const delegationManager = '0xdb9b1e94b5b69df7e401ddbede43491141047db3';
const delegationAbi = parseAbi(['function redeemDelegations(bytes[],bytes32[],bytes[])']);

export function matchesDelegatedExecution(
  to: Address,
  input: Hex,
  owner: Address,
  target: Address,
  expectedData: Hex,
  requireValue: boolean
) {
  if (!isAddressEqual(to, delegationManager)) return false;
  try {
    const { args: [contexts, modes, executions] } = decodeFunctionData({ abi: delegationAbi, data: input });
    if (contexts.length !== modes.length || modes.length !== executions.length) return false;
    for (let i = 0; i < executions.length; i++) {
      const exec = executions[i];
      const execTarget = exec.slice(0, 42) as Address;
      const execValueHex = ('0x' + exec.slice(42, 106)) as Hex;
      const execData = ('0x' + exec.slice(106)) as Hex;
      const execValue = hexToBigInt(execValueHex);
      const context = contexts[i].toLowerCase();
      const hasOwner = context.includes(owner.toLowerCase().replace('0x', ''));
      if (
        hasOwner &&
        isAddressEqual(execTarget, target) &&
        (expectedData === '0x' ? (execData === '0x' || execData === '0x0') : execData.toLowerCase() === expectedData.toLowerCase()) &&
        (!requireValue || execValue > 0n)
      ) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

export function matchesDelegatedPolicyCall(to: Address, input: Hex, vault: Address, expected: Hex, owner?: Address) {
  if (owner) return matchesDelegatedExecution(to, input, owner, vault, expected, false);
  if (!isAddressEqual(to, delegationManager)) return false;
  try {
    const { args: [contexts, modes, executions] } = decodeFunctionData({ abi: delegationAbi, data: input });
    const packed = concatHex([vault, zeroHash, expected]).toLowerCase();
    return contexts.length === modes.length && modes.length === executions.length &&
      executions.filter((execution, index) =>
        contexts[index] !== '0x' && modes[index] === zeroHash && execution.toLowerCase() === packed).length === 1;
  } catch {
    return false;
  }
}

export async function recordDeploymentStep(owner: Address, id: string, kind: StepKind, hash: Hash) {
  const deployment = deployerService.getDeployment(owner, id);
  if (!deployment) return undefined;
  const { rscAddress, vaultAddress } = deployment.contracts;
  if (!rscAddress) return false;
  const reactive = kind === 'reactive-reserve';
  const chainId = reactive ? 5318007 : 84532;
  const client = reactive ? chainService.lasnaPublicClient : chainService.basePublicClient;
  const [actualChainId, tx, receipt] = await Promise.all([
    client.getChainId(), client.getTransaction({ hash }), client.getTransactionReceipt({ hash }),
  ]);
  if (actualChainId !== chainId || receipt.status !== 'success' || tx.hash !== receipt.transactionHash ||
      tx.blockHash !== receipt.blockHash || tx.blockNumber !== receipt.blockNumber) return false;

  const takeProfit = deployment.template === takeProfitTemplate;
  if (kind === 'register-rsc' || kind === 'price-policy' || (takeProfit && kind === 'authorization')) {
    if (!takeProfit) return false;
    const logs = receipt.logs.filter(log => isAddressEqual(log.address, vaultAddress));
    const vault = { address: vaultAddress, abi: PRICE_ORDER_VAULT_ABI } as const;
    const [code, vaultOwner] = await Promise.all([
      client.getCode({ address: vaultAddress, blockNumber: receipt.blockNumber }),
      client.readContract({ ...vault, functionName: 'owner', blockNumber: receipt.blockNumber }),
    ]);
    if (!matchesRuntime(code, PRICE_ORDER_VAULT_RUNTIME) || !isAddressEqual(vaultOwner, owner)) return false;

    if (kind === 'register-rsc') {
      const events = parseEventLogs({ abi: PRICE_ORDER_VAULT_ABI, eventName: 'RSCRegistered', logs, strict: true });
      if (events.filter(log => isAddressEqual(log.args.rsc, rscAddress)).length !== 1) return false;
    } else if (kind === 'authorization') {
      const events = parseEventLogs({ abi: PRICE_ORDER_VAULT_ABI, eventName: 'RSCAuthorized', logs, strict: true });
      if (events.filter(log => isAddressEqual(log.args.rsc, rscAddress)).at(-1)?.args.status !== true) return false;
    } else {
      if (!tx.to || tx.value !== 0n || receipt.blockNumber === 0n) return false;
      const { config } = resolveTakeProfit(deployment.graph);
      const expected = encodeFunctionData({ abi: PRICE_ORDER_VAULT_ABI, functionName: 'configurePriceOrder',
        args: [rscAddress, { mode: config.mode, percent: config.percent, threshold: config.threshold }] });
      const direct = isAddressEqual(tx.to, vaultAddress) && isAddressEqual(tx.from, owner) && tx.input === expected;
      if (!direct && !matchesDelegatedPolicyCall(tx.to, tx.input, vaultAddress, expected)) return false;
      const [before, after, policy] = await Promise.all([
        client.readContract({ ...vault, functionName: 'permissions', args: [rscAddress], blockNumber: receipt.blockNumber - 1n }),
        client.readContract({ ...vault, functionName: 'permissions', args: [rscAddress], blockNumber: receipt.blockNumber }),
        client.readContract({ ...vault, functionName: 'pricePolicies', args: [rscAddress], blockNumber: receipt.blockNumber }),
      ]);
      if (before !== 0 || after !== 1 || policy[0] !== config.mode || policy[1] !== config.percent || policy[2] !== config.threshold) return false;
    }
  } else if (kind === 'authorization') {
    const events = parseEventLogs({
      abi: ACTION_VAULT_ABI, eventName: 'RSCAuthorized',
      logs: receipt.logs.filter(log => isAddressEqual(log.address, vaultAddress)),
    });
    const authorization = events.filter(log => isAddressEqual(log.args.rsc, rscAddress)).at(-1);
    if (!authorization?.args.status) return false;
    // The verified Vault emits this event only from its owner-only authorization method.
    // A delegated wallet can reach that method through a different outer transaction.
    const [code, vaultOwner] = await Promise.all([
      client.getCode({ address: vaultAddress, blockNumber: receipt.blockNumber }),
      client.readContract({ address: vaultAddress, abi: ACTION_VAULT_ABI, functionName: 'owner', blockNumber: receipt.blockNumber }),
    ]);
    if (!matchesRuntime(code, VAULT_RUNTIME) || !isAddressEqual(vaultOwner, owner)) return false;
  } else {
    const isDirect = Boolean(tx.to && receipt.to && isAddressEqual(tx.from, owner) && isAddressEqual(receipt.from, owner) &&
      isAddressEqual(tx.to, receipt.to) && tx.value > 0n);
    const toAddress = tx.to ?? undefined;
    if (kind === 'principal') {
      const direct = isDirect && tx.to && isAddressEqual(tx.to, vaultAddress) && tx.input === '0x';
      const delegated = !reactive && Boolean(toAddress && matchesDelegatedExecution(toAddress, tx.input, owner, vaultAddress, '0x', true));
      if (!direct && !delegated) return false;
    } else {
      const target = reactive ? STOP_LOSS_TEMPLATE.omniSystem : STOP_LOSS_TEMPLATE.callbackProxy;
      const input = encodeFunctionData({ abi: reserveAbi, functionName: 'depositTo', args: [reactive ? rscAddress : vaultAddress] });
      const direct = isDirect && tx.to && isAddressEqual(tx.to, target) && tx.input === input;
      const delegated = !reactive && Boolean(toAddress && matchesDelegatedExecution(toAddress, tx.input, owner, target, input, true));
      if (!direct && !delegated) return false;
    }
  }
  const block = await client.getBlock({ blockNumber: receipt.blockNumber });
  if (block.hash !== receipt.blockHash) return false;
  deploymentStore().recordStep({ deploymentId: id, kind, txHash: hash, chainId,
    blockNumber: receipt.blockNumber.toString(), blockHash: receipt.blockHash });
  return true;
}
