import { ACTION_VAULT_ABI } from '../abis/ActionVault.js';
import { isAddress, isAddressEqual, parseEther } from 'viem';
import type { PipelineGraph } from '../schemas/pipeline.schema.js';
import { chainService } from './chain.service.js';
import { STOP_LOSS_PIPELINE_ABI, STOP_LOSS_PIPELINE_BYTECODE } from '../abis/StopLossPipeline.js';

export interface ExtractedPipelineParams {
  pairAddress: `0x${string}`;
  priceThresholdWei: bigint;
  cooldownSeconds: bigint;
  percentToSwap: bigint;
  actionVaultAddress: `0x${string}`;
  requiredHits: bigint;
  velocityThresholdBps: bigint;
  windowSeconds: bigint;
  originChainId: bigint;
  originTopic0: `0x${string}`;
}

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

  /**
   * Thẩm định đồ thị DAG và trích xuất tham số cho Smart Contract
   */
  public extractParams(graph: PipelineGraph): ExtractedPipelineParams {
    // 1. Tìm Trigger Node
    const triggerNode = graph.nodes.find(
      (n) => n.type === 'watchDEXPrice' || n.data.pairAddress
    );
    const pairAddress = triggerNode?.data.pairAddress;
    if (typeof pairAddress !== 'string' || !isAddress(pairAddress, { strict: false })) {
      throw new Error('DAG Validation Failed: configure a valid origin pool address.');
    }

    // 2. Tìm Condition Node (Price threshold)
    const priceNode = graph.nodes.find(
      (n) => n.type === 'priceThresholdGuard' || n.data.thresholdPriceUSD !== undefined
    );
    const thresholdUSD = priceNode?.data.thresholdPriceUSD || 1800;
    const priceThresholdWei = BigInt(Math.floor(thresholdUSD)) * 10n ** 18n;

    // 3. Tìm Cooldown Node
    const cooldownNode = graph.nodes.find(
      (n) => n.type === 'cooldownGuard' || n.data.cooldownSeconds !== undefined
    );
    const cooldownSeconds = BigInt(cooldownNode?.data.cooldownSeconds || 300);

    // 4. Tìm Action Node (DEX Swap / Vault)
    const actionNode = graph.nodes.find(
      (n) => n.type === 'dexSwap' || n.data.actionVaultAddress
    );
    const actionVaultAddress = actionNode?.data.actionVaultAddress;
    if (typeof actionVaultAddress !== 'string' || !isAddress(actionVaultAddress, { strict: false })) {
      throw new Error('DAG Validation Failed: configure a valid ActionVault address.');
    }
    const percentToSwap = BigInt(actionNode?.data.amountPercentage || 50);

    // 5. Tìm Anti-Wick hits (Stateful Anti-Wick)
    const requiredHits = BigInt(priceNode?.data.confirmationHits || 1);

    // 6. Tìm Price Velocity Guard
    const velocityNode = graph.nodes.find(
      (n) => n.type === 'priceVelocityGuard' || n.data.velocityThresholdBps !== undefined
    );
    const velocityThresholdBps = BigInt(velocityNode?.data.velocityThresholdBps || 0);
    const windowSeconds = BigInt(velocityNode?.data.windowSeconds || 0);

    // 7. Multi-chain Origin & Topic
    const originChainId = BigInt(triggerNode?.data.originChainId || 84532);
    const originTopic0 = (triggerNode?.data.customTopic0 ||
      '0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1') as `0x${string}`;

    return {
      pairAddress,
      priceThresholdWei,
      cooldownSeconds,
      percentToSwap,
      actionVaultAddress,
      requiredHits,
      velocityThresholdBps,
      windowSeconds,
      originChainId,
      originTopic0,
    };
  }

  /**
   * Deploy RSC lên Reactive Lasna và tự động tài trợ 1.0 lREACT gas
   */
  public async deployPipeline(graph: PipelineGraph): Promise<DeploymentResult> {
    const validation = this.validateDAG(graph);
    if (!validation.valid) {
      throw new Error(`DAG Validation Failed: ${validation.errors.join('; ')}`);
    }

    const supportedNodes = new Set(['watchDEXPrice', 'priceThresholdGuard', 'cooldownGuard', 'priceVelocityGuard', 'dexSwap']);
    if (graph.nodes.some(node => !supportedNodes.has(node.type) ||
      (node.type === 'priceThresholdGuard' && node.data.operator && node.data.operator !== 'LESS_THAN_OR_EQUAL'))) {
      throw new Error('DAG Validation Failed: this graph contains rules unsupported by the stop-loss deployer.');
    }

    const params = this.extractParams(graph);
    const pipelineId = `omniflow-pipe-${Date.now().toString(36)}`;

    if (!chainService.lasnaWalletClient || !chainService.relayerAccount) {
      throw new Error('Deployment signer is not configured.');
    }

    const owner = await chainService.basePublicClient.readContract({
      address: params.actionVaultAddress,
      abi: ACTION_VAULT_ABI,
      functionName: 'owner',
    });
    if (!isAddressEqual(owner, graph.metadata.ownerAddress as `0x${string}`)) {
      throw new Error('DAG Validation Failed: the selected Vault belongs to another wallet.');
    }

    const value = parseEther('1.0');
    const txHash = await chainService.lasnaWalletClient.deployContract({
      chain: chainService.lasnaWalletClient.chain,
      account: chainService.relayerAccount,
      abi: STOP_LOSS_PIPELINE_ABI,
      bytecode: STOP_LOSS_PIPELINE_BYTECODE,
      args: [
        params.pairAddress, params.priceThresholdWei, params.cooldownSeconds, params.percentToSwap,
        params.actionVaultAddress, params.requiredHits, params.velocityThresholdBps,
        params.windowSeconds, params.originChainId, BigInt(params.originTopic0),
      ],
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
