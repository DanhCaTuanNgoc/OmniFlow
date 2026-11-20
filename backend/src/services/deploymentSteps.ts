import { encodeFunctionData, isAddressEqual, parseAbi, parseEventLogs, type Address, type Hash } from 'viem';
import { ACTION_VAULT_ABI, STOP_LOSS_TEMPLATE } from '@omniflow/shared';
import { deploymentStore } from '../data/deployments.js';
import { chainService } from './chain.service.js';
import { deployerService } from './deployer.service.js';

export const deploymentSteps = ['authorization', 'principal', 'callback-reserve', 'reactive-reserve'] as const;
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
  if (actualChainId !== chainId || receipt.status !== 'success' || !tx.to || !receipt.to ||
      !isAddressEqual(tx.from, owner) || !isAddressEqual(receipt.from, owner) || tx.blockHash !== receipt.blockHash ||
      !isAddressEqual(tx.to, receipt.to)) return false;

  if (kind === 'authorization') {
    const authorization = encodeFunctionData({
      abi: ACTION_VAULT_ABI, functionName: 'setAuthorizedRSC', args: [rscAddress, true],
    });
    const events = parseEventLogs({
      abi: ACTION_VAULT_ABI, eventName: 'RSCAuthorized',
      logs: receipt.logs.filter(log => isAddressEqual(log.address, vaultAddress)),
    });
    if (!isAddressEqual(tx.to, vaultAddress) || tx.input !== authorization ||
        !events.some(log => isAddressEqual(log.args.rsc, rscAddress) && log.args.status)) return false;
  } else if (kind === 'principal') {
    if (!isAddressEqual(tx.to, vaultAddress) || tx.input !== '0x' || tx.value <= 0n) return false;
  } else {
    const target = reactive ? STOP_LOSS_TEMPLATE.omniSystem : STOP_LOSS_TEMPLATE.callbackProxy;
    const input = encodeFunctionData({ abi: reserveAbi, functionName: 'depositTo', args: [reactive ? rscAddress : vaultAddress] });
    if (!isAddressEqual(tx.to, target) || tx.input !== input || tx.value <= 0n) return false;
  }
  const block = await client.getBlock({ blockNumber: receipt.blockNumber });
  if (block.hash !== receipt.blockHash) return false;
  deploymentStore().recordStep({ deploymentId: id, kind, txHash: hash, chainId,
    blockNumber: receipt.blockNumber.toString(), blockHash: receipt.blockHash });
  return true;
}
