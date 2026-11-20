import { getAccount, sendTransaction, waitForTransactionReceipt, writeContract } from 'wagmi/actions';
import { isAddressEqual, parseAbi, type Address, type Hash } from 'viem';
import { ACTION_VAULT_ABI, STOP_LOSS_TEMPLATE } from '@omniflow/shared';
import { wagmiConfig } from './wagmi';
import { signInToWorkspace, workspaceRequest } from './workspaceSession';

type DeploymentStep = 'authorization' | 'principal' | 'callback-reserve' | 'reactive-reserve';
const reserveAbi = parseAbi(['function depositTo(address) payable']);

export type DeploymentSummary = {
  pipelineId: string;
  workspacePipelineId: string | null;
  revisionId: string;
  template: string;
  name: string;
  createdAt: number;
  status: 'signed' | 'deployed' | 'reverted';
  contracts: {
    rscAddress: Address | null;
    rscChainId: number;
    rscTxHash: Hash;
    vaultAddress: Address;
    vaultChainId: number;
  };
  reconciliationError?: string;
};

export type DeploymentDetail = DeploymentSummary & {
  graph: unknown;
  requestKey: string;
  steps: { kind: DeploymentStep; txHash: Hash; chainId: number; blockNumber: string; blockHash: Hash }[];
  runtime: {
    status: 'unverified' | 'awaiting-authorization' | 'awaiting-principal' | 'awaiting-fees' | 'ready';
    base: { authorized: boolean; principal: string; callback: FeeState } | null;
    lasna: { native: string; reactive: FeeState } | null;
    readAt: string;
  } | null;
};

type FeeState = { debt: string; reserves: string; budget: string };

export async function runDeploymentAction(owner: Address, deployment: DeploymentSummary, kind: DeploymentStep, value?: bigint) {
  const { rscAddress, vaultAddress } = deployment.contracts;
  if (!rscAddress) throw new Error('Wait for the Lasna deployment receipt.');
  await signInToWorkspace(owner);
  const reactive = kind === 'reactive-reserve';
  const chainId = reactive ? 5318007 : 84532;
  const key = `omniflow.step.v1.${owner.toLowerCase()}.${deployment.pipelineId}.${kind}`;
  let hash = localStorage.getItem(key) as Hash | null;
  if (!hash) {
    const account = getAccount(wagmiConfig);
    if (!account.address || !isAddressEqual(account.address, owner) || account.chainId !== chainId) {
      throw new Error(`Switch the deployment wallet to ${reactive ? 'Reactive Lasna' : 'Base Sepolia'}.`);
    }
    if (kind === 'authorization') {
      hash = await writeContract(wagmiConfig, {
        account: owner, chainId: 84532, address: vaultAddress, abi: ACTION_VAULT_ABI,
        functionName: 'setAuthorizedRSC', args: [rscAddress, true],
      });
    } else {
      if (value === undefined || value <= 0n) throw new Error('Enter an amount greater than zero.');
      hash = kind === 'principal'
        ? await sendTransaction(wagmiConfig, { account: owner, chainId: 84532, to: vaultAddress, value })
        : await writeContract(wagmiConfig, {
          account: owner, chainId,
          address: reactive ? STOP_LOSS_TEMPLATE.omniSystem : STOP_LOSS_TEMPLATE.callbackProxy,
          abi: reserveAbi, functionName: 'depositTo', args: [reactive ? rscAddress : vaultAddress], value,
        });
    }
    localStorage.setItem(key, hash);
  }
  const receipt = await waitForTransactionReceipt(wagmiConfig, { hash, chainId, confirmations: reactive ? 1 : 2 });
  if (receipt.status === 'reverted') {
    localStorage.removeItem(key);
    throw new Error(`Transaction reverted: ${receipt.transactionHash}.`);
  }
  if (receipt.transactionHash !== hash) localStorage.setItem(key, receipt.transactionHash);
  await workspaceRequest(owner, `/pipeline/deployments/${deployment.pipelineId}/steps`, {
    method: 'POST', body: JSON.stringify({ kind, hash: receipt.transactionHash }),
  });
  localStorage.removeItem(key);
  return receipt.transactionHash;
}
