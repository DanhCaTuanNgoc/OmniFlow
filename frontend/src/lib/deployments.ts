import { getAccount, sendTransaction, switchChain, waitForTransactionReceipt, writeContract } from 'wagmi/actions';
import { isAddressEqual, parseAbi, type Address, type Hash } from 'viem';
import { ACTION_VAULT_ABI, PRICE_ORDER_VAULT_ABI, resolvePhaseTwo, STOP_LOSS_TEMPLATE, type StopLossGraph } from '@omniflow/shared';
import { wagmiConfig } from './wagmi';
import { signInToWorkspace, workspaceRequest } from './workspaceSession';

type DeploymentStep = 'register-rsc' | 'price-policy' | 'authorization' | 'principal' | 'callback-reserve' | 'reactive-reserve';
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
  broadcastLimitReached?: boolean;
  steps?: { kind: DeploymentStep; txHash: Hash; chainId: number; blockNumber: string; blockHash: Hash }[];
  runtime?: {
    status: 'unverified' | 'awaiting-authorization' | 'awaiting-principal' | 'awaiting-fees' | 'ready';
    base: { authorized: boolean; principal: string; callback: FeeState; onboarding?: 'register-rsc' | 'price-policy' | 'policy-mismatch' | null } | null;
    lasna: { native: string; reactive: FeeState } | null;
    readAt: string;
  } | null;
  isPaused?: boolean;
};

export type DeploymentExecution = {
  id?: string;
  status: string;
  timestamp: string;
  destinationTxHash?: Hash;
  details?: { reason?: string };
};

export type DeploymentDetail = DeploymentSummary & {
  graph: unknown;
  requestKey: string;
  latestExecution: DeploymentExecution | null;
  steps: { kind: DeploymentStep; txHash: Hash; chainId: number; blockNumber: string; blockHash: Hash }[];
  runtime: {
    status: 'unverified' | 'awaiting-authorization' | 'awaiting-principal' | 'awaiting-fees' | 'ready';
    base: { authorized: boolean; principal: string; callback: FeeState; onboarding?: 'register-rsc' | 'price-policy' | 'policy-mismatch' | null } | null;
    lasna: { native: string; reactive: FeeState } | null;
    readAt: string;
  } | null;
};

export const takeProfitTemplate = 'take-profit@1';

type FeeState = { debt: string; reserves: string; budget: string };

export function deploymentStepKey(owner: Address, pipelineId: string, kind: DeploymentStep) {
  return `omniflow.step.v1.${owner.toLowerCase()}.${pipelineId}.${kind}`;
}

export async function runDeploymentAction(owner: Address, deployment: DeploymentSummary, kind: DeploymentStep, value?: bigint, graph?: unknown) {
  const { rscAddress, vaultAddress } = deployment.contracts;
  if (!rscAddress) throw new Error('Wait for the Lasna deployment receipt.');
  await signInToWorkspace(owner);
  const reactive = kind === 'reactive-reserve';
  const chainId = reactive ? 5318007 : 84532;
  const key = deploymentStepKey(owner, deployment.pipelineId, kind);
  let hash = localStorage.getItem(key) as Hash | null;
  if (!hash) {
    if (deployment.template === takeProfitTemplate && getAccount(wagmiConfig).chainId !== chainId) {
      await switchChain(wagmiConfig, { chainId });
    }
    const account = getAccount(wagmiConfig);
    if (!account.address || !isAddressEqual(account.address, owner) || account.chainId !== chainId) {
      throw new Error(`Switch the deployment wallet to ${reactive ? 'Reactive Lasna' : 'Base Sepolia'}.`);
    }
    const profit = deployment.template === takeProfitTemplate;
    if (kind === 'register-rsc') {
      if (!profit) throw new Error('This deployment does not use a Price Order Vault.');
      hash = await writeContract(wagmiConfig, { account: owner, chainId: 84532,
        address: vaultAddress, abi: PRICE_ORDER_VAULT_ABI, functionName: 'registerRSC', args: [rscAddress] });
    } else if (kind === 'price-policy') {
      if (!profit || !graph) throw new Error('The Take-Profit revision is unavailable.');
      const resolved = resolvePhaseTwo(graph as StopLossGraph);
      if (resolved.type !== 'price-order' || resolved.config.mode !== 1) throw new Error('Invalid Take-Profit policy.');
      const { mode, percent, threshold } = resolved.config;
      hash = await writeContract(wagmiConfig, { account: owner, chainId: 84532,
        address: vaultAddress, abi: PRICE_ORDER_VAULT_ABI, functionName: 'configurePriceOrder',
        args: [rscAddress, { mode, percent, threshold }] });
    } else if (kind === 'authorization') {
      hash = await writeContract(wagmiConfig, {
        account: owner, chainId: 84532, address: vaultAddress, abi: profit ? PRICE_ORDER_VAULT_ABI : ACTION_VAULT_ABI,
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
  try {
    await workspaceRequest(owner, `/pipeline/deployments/${deployment.pipelineId}/steps`, {
      method: 'POST', body: JSON.stringify({ kind, hash: receipt.transactionHash }),
    });
    localStorage.removeItem(key);
    return receipt.transactionHash;
  } catch (err) {
    if (err instanceof Error && err.message.includes('receipt does not match')) {
      localStorage.removeItem(key);
    }
    throw err;
  }
}

export async function setVaultRscAuthorization(owner: Address, deployment: DeploymentSummary, authorized: boolean) {
  const { rscAddress, vaultAddress } = deployment.contracts;
  if (!rscAddress) throw new Error('Wait for the Lasna deployment receipt.');
  await signInToWorkspace(owner);
  const account = getAccount(wagmiConfig);
  if (!account.address || !isAddressEqual(account.address, owner) || account.chainId !== 84532) {
    throw new Error('Switch the deployment wallet to Base Sepolia (84532).');
  }
  const hash = await writeContract(wagmiConfig, {
    account: owner, chainId: 84532, address: vaultAddress, abi: deployment.template === takeProfitTemplate ? PRICE_ORDER_VAULT_ABI : ACTION_VAULT_ABI,
    functionName: 'setAuthorizedRSC', args: [rscAddress, authorized],
  });
  const receipt = await waitForTransactionReceipt(wagmiConfig, { hash, chainId: 84532, confirmations: 2 });
  if (receipt.status === 'reverted') {
    throw new Error(`Transaction reverted: ${receipt.transactionHash}.`);
  }
  if (authorized) {
    try {
      await workspaceRequest(owner, `/pipeline/deployments/${deployment.pipelineId}/steps`, {
        method: 'POST', body: JSON.stringify({ kind: 'authorization', hash: receipt.transactionHash }),
      });
    } catch {
      // Step already registered
    }
  }
  return receipt.transactionHash;
}
