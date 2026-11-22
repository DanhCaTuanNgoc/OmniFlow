import { encodeFunctionData, isAddressEqual, parseAbi, parseEventLogs, type Address, type Hash } from 'viem';
import { ACTION_VAULT_ABI, PRICE_ORDER_VAULT_ABI, STOP_LOSS_TEMPLATE } from '@omniflow/shared';
import { deploymentStore } from '../data/deployments.js';
import { chainService } from './chain.service.js';
import { deployerService, resolveTakeProfit, takeProfitTemplate } from './deployer.service.js';
import { VAULT_RUNTIME } from '../abis/runtimeFingerprints.js';
import { matchesRuntime } from './runtimeBytecode.js';

export const deploymentSteps = ['register-rsc', 'price-policy', 'authorization', 'principal', 'callback-reserve', 'reactive-reserve'] as const;
type StepKind = typeof deploymentSteps[number];
const reserveAbi = parseAbi(['function depositTo(address) payable']);

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
    if (!takeProfit || !tx.to || !isAddressEqual(tx.to, vaultAddress) || !isAddressEqual(tx.from, owner) ||
        !isAddressEqual(receipt.from, owner) || tx.value !== 0n) return false;
    const { config } = resolveTakeProfit(deployment.graph);
    const expected = kind === 'register-rsc'
      ? encodeFunctionData({ abi: PRICE_ORDER_VAULT_ABI, functionName: 'registerRSC', args: [rscAddress] })
      : kind === 'price-policy'
        ? encodeFunctionData({ abi: PRICE_ORDER_VAULT_ABI, functionName: 'configurePriceOrder',
          args: [rscAddress, { mode: config.mode, percent: config.percent, threshold: config.threshold }] })
        : encodeFunctionData({ abi: PRICE_ORDER_VAULT_ABI, functionName: 'setAuthorizedRSC', args: [rscAddress, true] });
    if (tx.input !== expected) return false;
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
    if (!tx.to || !receipt.to || !isAddressEqual(tx.from, owner) || !isAddressEqual(receipt.from, owner) ||
        !isAddressEqual(tx.to, receipt.to) || tx.value <= 0n) return false;
    if (kind === 'principal') {
      if (!isAddressEqual(tx.to, vaultAddress) || tx.input !== '0x') return false;
    } else {
      const target = reactive ? STOP_LOSS_TEMPLATE.omniSystem : STOP_LOSS_TEMPLATE.callbackProxy;
      const input = encodeFunctionData({ abi: reserveAbi, functionName: 'depositTo', args: [reactive ? rscAddress : vaultAddress] });
      if (!isAddressEqual(tx.to, target) || tx.input !== input) return false;
    }
  }
  const block = await client.getBlock({ blockNumber: receipt.blockNumber });
  if (block.hash !== receipt.blockHash) return false;
  deploymentStore().recordStep({ deploymentId: id, kind, txHash: hash, chainId,
    blockNumber: receipt.blockNumber.toString(), blockHash: receipt.blockHash });
  return true;
}
