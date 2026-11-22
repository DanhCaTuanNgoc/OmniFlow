import { PRICE_ORDER_PIPELINE_ABI, PRICE_ORDER_PIPELINE_BYTECODE, resolvePhaseTwo } from '@omniflow/shared';
import { PRICE_ORDER_PIPELINE_RUNTIME } from '../abis/runtimeFingerprints.js';
import { verifyPriceOrderVault } from './vaultCompatibility.js';
import { encodeDeployData, formatEther, getContractAddress, isAddressEqual, keccak256, parseAbi, parseEventLogs, parseTransaction, TransactionReceiptNotFoundError, type Address } from 'viem';
import { env } from '../config/env.js';
import type { PipelineGraph } from '../schemas/pipeline.schema.js';
import { chainService } from './chain.service.js';
import { reactiveLasnaChain } from '../config/chains.js';
import { DeploymentConflict, deploymentEnvironment, deploymentStore, graphSnapshot, type DeploymentIntent } from '../data/deployments.js';
import { getDraft, publishReservedDraft } from '../data/pipelineDrafts.js';
import { STOP_LOSS_RUNTIME } from '../abis/runtimeFingerprints.js';
import { matchesRuntime } from './runtimeBytecode.js';
import { verifyStopLossVault } from './vaultCompatibility.js';
import {
  STOP_LOSS_PIPELINE_ABI, STOP_LOSS_PIPELINE_BYTECODE,
  STOP_LOSS_TEMPLATE, resolveStopLoss, stopLossConstructorArgs,
} from '@omniflow/shared';

const subscriptionAbi = parseAbi([
  'event Subscribe(address indexed subscriber, uint256 indexed chainId, address indexed emitter, uint256 topic0, uint256 topic1, uint256 topic2, uint256 topic3)',
]);
// Match REACTIVE_IGNORE in the vendored AbstractReactive used by the template.
const reactiveIgnore = 0xa65f96fc951c35ead38878e0f0b7a3c744a6f5ccc1476b313353ce31712313adn;
const template = `${STOP_LOSS_TEMPLATE.id}@${STOP_LOSS_TEMPLATE.version}`;

export const takeProfitTemplate = 'take-profit@1';

export function resolveTakeProfit(graph: PipelineGraph) {
  const resolved = resolvePhaseTwo(graph);
  if (resolved.type !== 'price-order' || resolved.config.mode !== 1) {
    throw new Error('DAG Validation Failed: select a Take-Profit graph.');
  }
  return resolved;
}

export class DeployerService {
  private readonly reconciliations = new Map<string, Promise<DeploymentIntent>>();
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

  public async deployPipeline(graph: PipelineGraph, requestKey?: string, workspacePipelineId?: string) {
    const validation = this.validateDAG(graph);
    if (!validation.valid) {
      throw new Error(`DAG Validation Failed: ${validation.errors.join('; ')}`);
    }

    const resolved = this.extractParams(graph);
    const ownerAddress = graph.metadata.ownerAddress.toLowerCase() as Address;
    const graphJson = graphSnapshot(graph);
    const existing = requestKey ? deploymentStore().get(ownerAddress, deploymentEnvironment, requestKey) : undefined;
    if (existing) {
      if (existing.graphJson !== graphJson || existing.template !== template ||
          (workspacePipelineId && existing.workspacePipelineId !== workspacePipelineId)) {
        throw new DeploymentConflict('This deployment key is already bound to another revision.');
      }
      return this.present(await this.resume(existing));
    }

    if (!chainService.lasnaWalletClient || !chainService.relayerAccount) {
      throw new Error('Deployment signer is not configured.');
    }
    if (!requestKey) throw new Error('Deployment key is required.');
    const workspaceDraft = workspacePipelineId ? await getDraft(ownerAddress, workspacePipelineId) : undefined;
    if (workspacePipelineId && !workspaceDraft) {
      throw new DeploymentConflict('The workspace pipeline is unavailable.');
    }

    const vaultAddress = resolved.actionVaultAddress;
    const vaultPool = resolved.pairAddress;
    const [reactiveChain, omniCode] = await Promise.all([
      chainService.lasnaPublicClient.getChainId(),
      chainService.lasnaPublicClient.getCode({ address: STOP_LOSS_TEMPLATE.omniSystem }),
      verifyStopLossVault(vaultAddress, ownerAddress, vaultPool),
    ]);
    if (reactiveChain !== STOP_LOSS_TEMPLATE.networks.reactiveChainId) {
      throw new Error('Deployment RPC must point to Lasna.');
    }
    if (!omniCode || omniCode === '0x') {
      throw new Error('The Reactive Omni system contract is unavailable on the configured Lasna RPC.');
    }
    const account = chainService.relayerAccount;
    const data = encodeDeployData({
      abi: STOP_LOSS_PIPELINE_ABI,
      bytecode: STOP_LOSS_PIPELINE_BYTECODE,
      args: stopLossConstructorArgs(resolved),
    });
    const lasna = chainService.lasnaPublicClient;
    const value = env.RSC_DEPLOY_FUNDING_LREACT;
    const [nonce, gasPrice, balance] = await Promise.all([
      lasna.getTransactionCount({ address: account.address, blockTag: 'pending' }),
      lasna.getGasPrice(),
      lasna.getBalance({ address: account.address }),
    ]);
    if (balance <= value) throw new Error('Deployment signer has insufficient lREACT.');
    const estimate = await lasna.estimateGas({ account: account.address, data, value });
    const gas = (estimate * 120n + 99n) / 100n;
    if (balance < value + gas * gasPrice) {
      throw new Error('Deployment signer has insufficient lREACT.');
    }
    const signedTransaction = await account.signTransaction({
      chainId: reactiveLasnaChain.id, type: 'legacy', data, gas, gasPrice, value, nonce,
    });
    const intent = deploymentStore().reserve({
      owner: ownerAddress, environment: deploymentEnvironment, key: requestKey, graphJson, template, workspacePipelineId,
      signer: account.address.toLowerCase() as Address,
      nonce,
      signedTransaction,
      txHash: keccak256(signedTransaction),
    }, workspaceDraft?.id);
    return this.present(await this.resume(intent));
  }

  public async ownerTakeProfit(graph: PipelineGraph, draftId: string, key: string, hash?: `0x${string}`) {
    const owner = graph.metadata.ownerAddress.toLowerCase() as Address;
    const snapshot = graphSnapshot(graph);
    const store = deploymentStore();
    const existing = store.get(owner, deploymentEnvironment, key);
    if (existing) {
      if (existing.graphJson !== snapshot || existing.template !== takeProfitTemplate ||
          existing.workspacePipelineId !== draftId || (hash && existing.txHash !== hash)) {
        throw new DeploymentConflict('The attempt is already bound to a different deployment.');
      }
      return { deployment: this.present(await this.reconcile(existing, false)) };
    }

    const prepared = store.getTakeProfitPreparation(owner, key);
    if (prepared && (prepared.draftId !== draftId || prepared.graphJson !== snapshot)) {
      throw new DeploymentConflict('The attempt is already bound to a different revision.');
    }
    if (hash && !prepared) throw new DeploymentConflict('Prepare the deployment before submitting a transaction.');
    if (!hash) {
      const draft = await getDraft(owner, draftId);
      if (!draft || graphSnapshot(JSON.parse(draft.graphJson)) !== snapshot) {
        throw new DeploymentConflict('Save this exact revision before deploying.');
      }
    }
    const { config, vaultPool } = resolveTakeProfit(graph);
    const data = encodeDeployData({ abi: PRICE_ORDER_PIPELINE_ABI, bytecode: PRICE_ORDER_PIPELINE_BYTECODE, args: [config] });
    const lasna = chainService.lasnaPublicClient;
    if (await lasna.getChainId() !== 5318007) throw new Error('Deployment RPC must point to Lasna.');

    if (!hash) {
      await verifyPriceOrderVault(config.vault, owner, vaultPool);
      const system = await lasna.getCode({ address: STOP_LOSS_TEMPLATE.omniSystem });
      if (!system || system === '0x') throw new Error('Reactive Omni system is unavailable on Lasna.');
      const value = prepared ? BigInt(prepared.fundingWei) : env.RSC_DEPLOY_FUNDING_LREACT;
      const [balance, gasPrice] = await Promise.all([lasna.getBalance({ address: owner }), lasna.getGasPrice()]);
      if (balance <= value) throw new Error('The owner wallet has insufficient lREACT.');
      const estimate = await lasna.estimateGas({ account: owner, data, value, gasPrice, type: 'legacy' });
      const gas = (estimate * 120n + 99n) / 100n;
      if (balance < value + gas * gasPrice) throw new Error('The owner wallet has insufficient lREACT.');
      const reserved = store.prepareTakeProfit(owner, key, draftId, snapshot, value);
      if (reserved.draftId !== draftId || reserved.graphJson !== snapshot || BigInt(reserved.fundingWei) !== value) {
        throw new DeploymentConflict('The attempt is already bound to a different quote.');
      }
      return { transaction: { data, value: value.toString(), gas: gas.toString(), gasPrice: gasPrice.toString() } };
    }

    const tx = await lasna.getTransaction({ hash });
    if (!isAddressEqual(tx.from, owner) || tx.to !== null || tx.input !== data || tx.value !== BigInt(prepared!.fundingWei)) {
      throw new DeploymentConflict('The Lasna transaction does not match the owner and Take-Profit revision.');
    }
    const intent = store.reserve({
      owner, environment: deploymentEnvironment, key, graphJson: snapshot, template: takeProfitTemplate,
      workspacePipelineId: draftId, signer: owner, nonce: tx.nonce, signedTransaction: '0x', txHash: hash,
    }, draftId);
    return { deployment: this.present(await this.reconcile(intent, false)) };
  }

  public async resumePending() {
    if (!chainService.relayerAccount) return;
    const intent = deploymentStore().pendingForSigner(chainService.relayerAccount.address);
    if (intent && intent.signedTransaction !== '0x') await this.resume(intent);
  }

  private async resume(intent: DeploymentIntent) {
    const inFlight = this.reconciliations.get(intent.id);
    if (inFlight) return inFlight;
    const work = (async () => {
      if (intent.status === 'signed' && intent.workspacePipelineId) {
        await publishReservedDraft(intent.owner, intent.workspacePipelineId);
      }
      return this.reconcile(intent, true);
    })();
    this.reconciliations.set(intent.id, work);
    try {
      return await work;
    } finally {
      this.reconciliations.delete(intent.id);
    }
  }

  private async reconcile(intent: DeploymentIntent, broadcast: boolean) {
    if (intent.status !== 'signed') return intent;
    const lasna = chainService.lasnaPublicClient;
    if (await lasna.getChainId() !== STOP_LOSS_TEMPLATE.networks.reactiveChainId) {
      throw new Error('Deployment RPC must point to Lasna.');
    }
    let receipt;
    try {
      receipt = await lasna.getTransactionReceipt({ hash: intent.txHash });
    } catch (error) {
      if (!(error instanceof TransactionReceiptNotFoundError)) throw error;
    }
    if (!receipt && broadcast && deploymentStore().claimBroadcast(intent.id)) {
      try {
        await lasna.sendRawTransaction({ serializedTransaction: intent.signedTransaction });
      } catch {
        // Reconcile the stored hash even when submission times out or the RPC already has the transaction.
      }
      try {
        receipt = await lasna.waitForTransactionReceipt({
          hash: intent.txHash, timeout: 8_000, checkReplacement: false,
        });
      } catch {
        return deploymentStore().get(intent.owner, intent.environment, intent.key) ?? intent;
      }
    }
    if (!receipt) return intent;
    if (receipt.status === 'reverted') return deploymentStore().settle(intent, 'reverted', null);

    const predicted = getContractAddress({ from: intent.signer, nonce: BigInt(intent.nonce) });
    if (!receipt.contractAddress || !isAddressEqual(receipt.contractAddress, predicted) ||
        !isAddressEqual(receipt.from, intent.signer)) {
      throw new Error('The Lasna receipt does not match the signed deployment.');
    }
    const canonical = await lasna.getBlock({ blockNumber: receipt.blockNumber });
    if (canonical.hash !== receipt.blockHash) throw new Error('The Lasna deployment receipt is not canonical.');
    const code = await lasna.getCode({ address: predicted, blockNumber: receipt.blockNumber });
    const takeProfit = intent.template === takeProfitTemplate;
    if (!matchesRuntime(code, takeProfit ? PRICE_ORDER_PIPELINE_RUNTIME : STOP_LOSS_RUNTIME)) {
      throw new Error('The Lasna deployment bytecode does not match the template.');
    }
    const graph = JSON.parse(intent.graphJson) as PipelineGraph;
    const phaseTwo = takeProfit ? resolveTakeProfit(graph).config : undefined;
    const stopLoss = phaseTwo ? undefined : this.extractParams(graph);
    const pairAddress = phaseTwo?.originPool ?? stopLoss!.pairAddress;
    const originChainId = phaseTwo?.originChainId ?? stopLoss!.originChainId;
    const originTopic0 = phaseTwo ? STOP_LOSS_TEMPLATE.syncTopic : stopLoss!.originTopic0;
    const subscriptions = parseEventLogs({
      abi: subscriptionAbi, eventName: 'Subscribe',
      logs: receipt.logs.filter(log => isAddressEqual(log.address, STOP_LOSS_TEMPLATE.omniSystem)),
    });
    if (subscriptions.length !== 1 || !subscriptions.some(({ args }) =>
      isAddressEqual(args.subscriber, predicted) && args.chainId === originChainId &&
      isAddressEqual(args.emitter, pairAddress) && args.topic0 === BigInt(originTopic0) &&
      [args.topic1, args.topic2, args.topic3].every(topic => topic === reactiveIgnore))) {
      throw new Error('The Lasna deployment receipt has no unique matching subscription.');
    }
    return deploymentStore().settle(intent, 'deployed', predicted);
  }

  public async listDeployments(owner: Address) {
    const intents = deploymentStore().list(owner.toLowerCase() as Address, deploymentEnvironment);
    return Promise.all(intents.map(async intent => {
      try {
        return this.present(await this.reconcile(intent, false));
      } catch {
        return { ...this.present(intent), reconciliationError: 'Unable to reconcile the Lasna receipt.' };
      }
    }));
  }

  public async refreshOwnerDeployment(owner: Address, id: string) {
    const intent = deploymentStore().getById(owner, id);
    if (intent?.template === takeProfitTemplate && intent.status === 'signed') {
      await this.reconcile(intent, false);
    }
  }

  public getDeployment(owner: Address, id: string) {
    const intent = deploymentStore().getById(owner, id);
    if (!intent) return undefined;
    return {
      ...this.present(intent),
      graph: JSON.parse(intent.graphJson) as PipelineGraph,
      requestKey: intent.key,
      steps: deploymentStore().steps(intent.id),
    };
  }

  private present(intent: DeploymentIntent) {
    const graph = JSON.parse(intent.graphJson) as PipelineGraph;
    const ownerSigned = intent.template === takeProfitTemplate;
    const actionVaultAddress = ownerSigned ? resolveTakeProfit(graph).config.vault : this.extractParams(graph).actionVaultAddress;
    return {
      success: intent.status === 'deployed',
      pipelineId: intent.id,
      workspacePipelineId: intent.workspacePipelineId,
      revisionId: intent.revisionId,
      graphHash: intent.graphHash,
      template: intent.template,
      status: intent.status,
      broadcastLimitReached: intent.status === 'signed' && intent.broadcastCount >= 5,
      name: graph.metadata.name,
      createdAt: intent.createdAt,
      contracts: {
        rscAddress: intent.rscAddress,
        rscChainId: 5318007,
        rscTxHash: intent.txHash,
        vaultAddress: actionVaultAddress,
        vaultChainId: 84532,
      },
      gasSponsored: ownerSigned ? null : {
        amountLReact: formatEther(parseTransaction(intent.signedTransaction).value ?? 0n),
      },
      explorerUrls: {
        reactscan: intent.rscAddress ? `https://lasna.reactscan.net/address/${intent.rscAddress}` : null,
        basescan: `https://sepolia.basescan.org/address/${actionVaultAddress}`,
      },
    };
  }
}

export const deployerService = new DeployerService();
