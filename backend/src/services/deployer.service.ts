import { isAddressEqual, parseAbi } from 'viem';
import type { PipelineGraph } from '../schemas/pipeline.schema.js';
import { chainService } from './chain.service.js';
import {
  ACTION_VAULT_ABI, STOP_LOSS_PIPELINE_ABI, STOP_LOSS_PIPELINE_BYTECODE,
  STOP_LOSS_TEMPLATE, resolveStopLoss, stopLossConstructorArgs,
} from '@omniflow/shared';

const marketAbi = parseAbi([
  'function WETH() view returns (address)',
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function decimals() view returns (uint8)',
]);

export interface DeploymentResult {
  success: boolean;
  pipelineId: string;
  contracts: {
    rscAddress: string;
    rscChainId: number;
    rscTxHash: string;
    vaultAddress: string;
    vaultChainId: number;
  };
  gasSponsored: {
    amountLReact: string;
  };
  explorerUrls: {
    reactscan: string;
    basescan: string;
  };
}

export class DeployerService {
  /**
   * Thẩm định tính hợp lệ của đồ thị DAG (DAG Cycle Detection, Typed Ports, Connectivity)
   */
  public validateDAG(graph: PipelineGraph): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 1. Kiểm tra tối thiểu 1 Trigger và 1 Action
    const triggerTypes = ['watchDEXPrice', 'customEventWatcher', 'watchTransfers', 'periodicCron'];
    const actionTypes = ['dexSwap', 'emergencySafeSweep', 'notifyLogWebhook'];

    const hasTrigger = graph.nodes.some(
      (n) => triggerTypes.includes(n.type) || n.data?.isTrigger || n.data?.pairAddress
    );
    const hasAction = graph.nodes.some(
      (n) => actionTypes.includes(n.type) || n.data?.isAction || n.data?.actionVaultAddress
    );

    if (!hasTrigger) {
      errors.push('Missing required Trigger node (e.g., watchDEXPrice, customEventWatcher)');
    }
    if (!hasAction) {
      errors.push('Missing required Action node (e.g., dexSwap, emergencySafeSweep)');
    }

    // 2. Kiểm tra các node rời rạc (Disjoint components)
    const connectedNodeIds = new Set<string>();
    for (const edge of graph.edges) {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    }
    for (const node of graph.nodes) {
      if (!connectedNodeIds.has(node.id)) {
        errors.push(`Disconnected node detected: '${node.id}' (${node.type})`);
      }
    }

    // 3. Kiểm tra chu trình lặp (Cycle Detection qua Kahn's Algorithm / Topological Sort)
    const inDegree = new Map<string, number>();
    const adj = new Map<string, string[]>();

    for (const node of graph.nodes) {
      inDegree.set(node.id, 0);
      adj.set(node.id, []);
    }

    for (const edge of graph.edges) {
      if (inDegree.has(edge.target)) {
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
      }
      adj.get(edge.source)?.push(edge.target);
    }

    const queue: string[] = [];
    for (const [nodeId, deg] of inDegree.entries()) {
      if (deg === 0) queue.push(nodeId);
    }

    let visitedCount = 0;
    while (queue.length > 0) {
      const u = queue.shift()!;
      visitedCount++;
      for (const v of adj.get(u) || []) {
        const nextDeg = (inDegree.get(v) || 0) - 1;
        inDegree.set(v, nextDeg);
        if (nextDeg === 0) queue.push(v);
      }
    }

    if (visitedCount < graph.nodes.length) {
      errors.push('Cycle detected in pipeline graph. Pipelines must be Directed Acyclic Graphs (DAG)');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  public extractParams(graph: PipelineGraph) {
    return resolveStopLoss(graph);
  }

  public async deployPipeline(graph: PipelineGraph): Promise<DeploymentResult> {
    const validation = this.validateDAG(graph);
    if (!validation.valid) {
      throw new Error(`DAG Validation Failed: ${validation.errors.join('; ')}`);
    }

    const params = this.extractParams(graph);
    const pipelineId = `omniflow-pipe-${Date.now().toString(36)}`;

    if (!chainService.lasnaWalletClient || !chainService.relayerAccount) {
      throw new Error('Deployment signer is not configured.');
    }

    const base = chainService.basePublicClient;
    const vault = { address: params.actionVaultAddress, abi: ACTION_VAULT_ABI } as const;
    const [baseChain, reactiveChain, omniCode] = await Promise.all([
      base.getChainId(), chainService.lasnaPublicClient.getChainId(),
      chainService.lasnaPublicClient.getCode({ address: STOP_LOSS_TEMPLATE.omniSystem }),
    ]);
    if (baseChain !== STOP_LOSS_TEMPLATE.networks.destinationChainId ||
        reactiveChain !== STOP_LOSS_TEMPLATE.networks.reactiveChainId) {
      throw new Error('Deployment RPCs must point to Base Sepolia and Lasna.');
    }
    if (!omniCode || omniCode === '0x') {
      throw new Error('The Reactive Omni system contract is unavailable on the configured Lasna RPC.');
    }
    const [owner, pair, router, quote, slippage] = await Promise.all([
      base.readContract({ ...vault, functionName: 'owner' }),
      base.readContract({ ...vault, functionName: 'tokenPair' }),
      base.readContract({ ...vault, functionName: 'uniswapRouter' }),
      base.readContract({ ...vault, functionName: 'usdcToken' }),
      base.readContract({ ...vault, functionName: 'MAX_SLIPPAGE_BPS' }),
    ]);
    if (owner.toLowerCase() !== graph.metadata.ownerAddress.toLowerCase()) {
      throw new Error('DAG Validation Failed: the selected Vault belongs to another wallet.');
    }
    if (!isAddressEqual(pair, params.pairAddress) || slippage !== BigInt(STOP_LOSS_TEMPLATE.maxSlippageBps)) {
      throw new Error('DAG Validation Failed: the Vault must use the selected pool and supported slippage limit.');
    }
    // A read-only call verifies that the configured callback proxy is authorized by the Vault.
    await base.simulateContract({
      ...vault, functionName: 'pay', args: [0n], account: STOP_LOSS_TEMPLATE.callbackProxy,
    });
    const [token0, token1, weth, quoteDecimals] = await Promise.all([
      base.readContract({ address: pair, abi: marketAbi, functionName: 'token0' }),
      base.readContract({ address: pair, abi: marketAbi, functionName: 'token1' }),
      base.readContract({ address: router, abi: marketAbi, functionName: 'WETH' }),
      base.readContract({ address: quote, abi: marketAbi, functionName: 'decimals' }),
    ]);
    if (!isAddressEqual(token0, weth) || !isAddressEqual(token1, quote) || quoteDecimals !== 18 ||
        await base.readContract({ address: weth, abi: marketAbi, functionName: 'decimals' }) !== 18) {
      throw new Error('DAG Validation Failed: stop-loss requires WETH as token0 and the Vault quote token as token1, both with 18 decimals.');
    }

    const value = STOP_LOSS_TEMPLATE.fundingWei;
    const txHash = await chainService.lasnaWalletClient.deployContract({
      chain: chainService.lasnaWalletClient.chain,
      account: chainService.relayerAccount,
      abi: STOP_LOSS_PIPELINE_ABI,
      bytecode: STOP_LOSS_PIPELINE_BYTECODE,
      args: stopLossConstructorArgs(params),
      value,
    });

    const receipt = await chainService.lasnaPublicClient.waitForTransactionReceipt({ hash: txHash });
    if (receipt.status !== 'success' || !receipt.contractAddress) {
      throw new Error(`Lasna deployment did not succeed: ${txHash}`);
    }
    const rscAddress = receipt.contractAddress;

    return {
      success: true,
      pipelineId,
      contracts: {
        rscAddress,
        rscChainId: 5318007,
        rscTxHash: txHash,
        vaultAddress: params.actionVaultAddress,
        vaultChainId: 84532,
      },
      gasSponsored: {
        amountLReact: '1.0',
      },
      explorerUrls: {
        reactscan: `https://lasna.reactscan.net/address/${rscAddress}`,
        basescan: `https://sepolia.basescan.org/address/${params.actionVaultAddress}`,
      },
    };
  }
}

export const deployerService = new DeployerService();
