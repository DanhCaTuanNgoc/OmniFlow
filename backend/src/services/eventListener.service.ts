import {
  decodeAbiParameters, decodeFunctionData, encodeAbiParameters, encodeFunctionData, isAddressEqual, keccak256, numberToHex, zeroAddress,
  parseAbi, parseAbiItem, parseEventLogs, type Hash, type Hex,
} from 'viem';
import { ACTION_VAULT_ABI, PRICE_ORDER_VAULT_ABI, STOP_LOSS_TEMPLATE, resolveStopLoss } from '@omniflow/shared';
import type { ActivityLogEntry, PendingExecution } from '../data/activityLog.js';
import { deploymentStore, type DeploymentIntent } from '../data/deployments.js';
import type { WebSocketGateway } from '../websocket/gateway.js';
import { chainService } from './chain.service.js';
import { resolveTakeProfit, takeProfitTemplate } from './deployer.service.js';
import { callbackConfiguration as configAbi, findStopLossDelivery } from './callbackEvidence.js';

const omniCallback = parseAbiItem('event OmniCallbackRequested(uint256 indexed chain_id, address indexed _contract, uint64 indexed gas_limit, bytes payload)');
const abi = parseAbi([
  'event Sync(uint112 reserve0, uint112 reserve1)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event CallbackRequest(uint256 indexed chainId, address indexed sender, address indexed recipient, uint8 version, bytes configuration)',
  'event CallbackFailure(address indexed target, bytes payload)',
  'function getCallbacks(uint256) view returns ((uint256 blockNumber, address requester, uint256 callbackIndex, uint256 chainId, uint256 txHash, bytes err)[])',
  'function deliverCallback(uint8,bytes)',
  'function executeStopLoss(address,address,uint256,uint256)',
]);
const { basePublicClient: base, lasnaPublicClient: lasna } = chainService;
const { callbackProxy: proxy, omniSystem: system } = STOP_LOSS_TEMPLATE;

type Reference = { status: Hex; refTx?: Hash; refChainId?: Hex; refEventIndex?: Hex };
async function reference(hash: Hash) {
  return await lasna.request({ method: 'eth_getTransactionReceipt', params: [hash] }) as Reference | null;
}

class EventListenerService {
  private wsGateway?: WebSocketGateway;
  private syncing = false;
  private readonly states = new Map<string, { checkedAt: string; error: boolean }>();

  public setWebSocketGateway(wsGateway: WebSocketGateway) {
    this.wsGateway = wsGateway;
  }

  public state(deploymentId: string) {
    return this.states.get(deploymentId);
  }

  public async sync() {
    if (this.syncing) return;
    this.syncing = true;
    try {
      const deployments = deploymentStore().deployed();
      if (!deployments.length) return;
      const [baseChain, lasnaChain, head, finalized] = await Promise.all([
        base.getChainId(), lasna.getChainId(),
        lasna.getBlockNumber({ cacheTime: 0 }), base.getBlock({ blockTag: 'finalized' }),
      ]);
      if (baseChain !== 84532 || lasnaChain !== 5318007) throw new Error('Unexpected chain ID in execution indexer.');
      for (const deployment of deployments) {
        try {
          const incomplete = await this.syncDeployment(deployment, head, finalized.number);
          this.states.set(deployment.id, { checkedAt: new Date().toISOString(), error: incomplete });
        } catch {
          this.states.set(deployment.id, { checkedAt: new Date().toISOString(), error: true });
        }
      }
    } catch {
      for (const deployment of deploymentStore().deployed()) {
        this.states.set(deployment.id, { checkedAt: new Date().toISOString(), error: true });
      }
    } finally {
      this.syncing = false;
    }
  }

  private async syncDeployment(deployment: DeploymentIntent, head: bigint, finalized: bigint) {
    const rsc = deployment.rscAddress;
    if (!rsc) return false;
    const store = deploymentStore();
    const start = store.cursor(deployment.id) ?? (await lasna.getTransactionReceipt({ hash: deployment.txHash })).blockNumber;
    const graph = JSON.parse(deployment.graphJson);
    const profit = deployment.template === takeProfitTemplate ? resolveTakeProfit(graph).config : undefined;
    const params = profit ? { actionVaultAddress: profit.vault, pairAddress: profit.originPool,
      percentToSwap: BigInt(profit.percent), priceThresholdWei: profit.threshold, cooldownSeconds: BigInt(profit.cooldown) }
      : resolveStopLoss(graph);
    if (start <= head) {
      const end = start + 199n < head ? start + 199n : head;
      const logs = await lasna.getLogs({ address: rsc, event: omniCallback, fromBlock: start, toBlock: end, strict: true });
      const hashes = new Set(logs.filter(log => log.args.chain_id === 84532n &&
        isAddressEqual(log.args._contract, params.actionVaultAddress)).map(log => log.transactionHash));
      const entries: PendingExecution[] = [];
      for (const hash of hashes) {
        const source = await reference(hash);
        if (!source) throw new Error('Lasna reference receipt is not available.');
        if (source.status !== '0x1' || !source.refTx || !source.refChainId || !source.refEventIndex ||
            BigInt(source.refChainId) !== 84532n) continue;
        const originLogIndex = Number(BigInt(source.refEventIndex));
        if (!Number.isSafeInteger(originLogIndex)) continue;
        entries.push({ deploymentId: deployment.id, reactiveTxHash: hash, originTxHash: source.refTx, originLogIndex });
      }
      store.ingestExecutionLogs(deployment.id, end + 1n, entries);
    }

    let incomplete = false;
    for (const entry of store.pendingExecutions(deployment.id, 20)) {
      try {
        const report = await this.readExecution(deployment, entry, params, graph.metadata.name, finalized);
        if (store.updateExecution(entry, report)) {
          this.wsGateway?.broadcast({ type: 'EXECUTION_UPDATED', pipelineId: deployment.id, timestamp: report.timestamp, data: report });
        }
      } catch {
        incomplete = true;
      } finally {
        store.markExecutionChecked(entry);
      }
    }
    return incomplete;
  }

  private async readExecution(
    deployment: DeploymentIntent, entry: PendingExecution, params: Pick<ReturnType<typeof resolveStopLoss>, 'actionVaultAddress' | 'pairAddress' | 'percentToSwap' | 'priceThresholdWei' | 'cooldownSeconds'>, name: string, finalized: bigint,
  ): Promise<ActivityLogEntry> {
    const rsc = deployment.rscAddress!;
    const vault = params.actionVaultAddress;
    const profit = deployment.template === takeProfitTemplate;
    const vaultAbi = profit ? PRICE_ORDER_VAULT_ABI : ACTION_VAULT_ABI;
    const [origin, reaction, records] = await Promise.all([
      base.getTransactionReceipt({ hash: entry.originTxHash }),
      lasna.getTransactionReceipt({ hash: entry.reactiveTxHash }),
      lasna.readContract({ address: system, abi, functionName: 'getCallbacks', args: [BigInt(entry.reactiveTxHash)] }),
    ]);
    const [originBlock, reactionBlock] = await Promise.all([
      base.getBlock({ blockNumber: origin.blockNumber }),
      lasna.getBlock({ blockHash: reaction.blockHash }),
    ]);
    const report: ActivityLogEntry = {
      id: `${deployment.id}:${entry.reactiveTxHash}`, pipelineId: deployment.id, pipelineName: name,
      timestamp: new Date(Number(reactionBlock.timestamp) * 1000).toISOString(),
      originChainId: 84532, originTxHash: entry.originTxHash, originBlock: Number(origin.blockNumber),
      originLogIndex: entry.originLogIndex, originBlockHash: origin.blockHash, originEvent: 'Sync',
      reactiveChainId: 5318007, reactiveTxHash: entry.reactiveTxHash, reactiveBlockHash: reaction.blockHash,
      destinationChainId: 84532, destinationAction: profit ? 'Take-Profit' : 'Stop-loss', status: 'PENDING', details: {},
    };
    const result = (status: ActivityLogEntry['status'], reason?: string): ActivityLogEntry =>
      ({ ...report, status, details: { ...report.details, ...(reason ? { reason } : {}) } });

    if (entry.conflictingReaction) return result('UNVERIFIED', 'Multiple reactions reference this source log.');
    if (originBlock.hash !== origin.blockHash) return result('REORGED', 'Source receipt is outside the canonical Base chain.');
    const syncs = parseEventLogs({
      abi, eventName: 'Sync', logs: origin.logs.filter(log =>
        log.logIndex === entry.originLogIndex && isAddressEqual(log.address, params.pairAddress)),
    });
    if (origin.status !== 'success' || syncs.length !== 1 || reaction.status !== 'success') {
      return result('UNVERIFIED', 'Source receipt does not contain the expected Sync log.');
    }
    const [sync] = syncs;
    if (sync.args.reserve0 === 0n) return result('UNVERIFIED', 'Source reserves cannot establish the trigger price.');
    report.details.triggerPrice = (sync.args.reserve1 * 10n ** 18n / sync.args.reserve0).toString();
    if (params.priceThresholdWei > 0n) report.details.thresholdPrice = params.priceThresholdWei.toString();

    const callbacks = parseEventLogs({
      abi: [omniCallback], eventName: 'OmniCallbackRequested', logs: reaction.logs.filter(log => isAddressEqual(log.address, rsc)),
    }).filter(log => log.args.chain_id === 84532n && isAddressEqual(log.args._contract, vault));
    if (callbacks.length !== 1) return result('UNVERIFIED', 'Expected one callback request for this deployment.');
    const callback = callbacks[0].args;
    let payload: Hex;
    let executionId: Hex | undefined;
    if (profit) {
      const requested = decodeFunctionData({ abi: PRICE_ORDER_VAULT_ABI, data: callback.payload });
      const expectedId = keccak256(encodeAbiParameters([
        { type: 'uint256' }, { type: 'address' }, { type: 'uint256' }, { type: 'uint256' },
      ], [84532n, params.pairAddress, BigInt(entry.originTxHash), BigInt(entry.originLogIndex)]));
      if (requested.functionName !== 'executePriceOrder' || !isAddressEqual(requested.args[0], zeroAddress)) {
        return result('UNVERIFIED', 'Unexpected Take-Profit callback.');
      }
      const order = requested.args[1];
      if (order.executionId !== expectedId || order.mode !== 1 || order.percent !== params.percentToSwap ||
          order.threshold !== params.priceThresholdWei || BigInt(report.details.triggerPrice) < order.threshold) {
        return result('UNVERIFIED', 'Take-Profit callback does not match the revision and source log.');
      }
      executionId = expectedId;
      report.details.executionId = expectedId;
      payload = encodeFunctionData({ abi: PRICE_ORDER_VAULT_ABI, functionName: 'executePriceOrder', args: [rsc, order] });
    } else {
      const requested = decodeFunctionData({ abi, data: callback.payload });
      if (requested.functionName !== 'executeStopLoss' || !isAddressEqual(requested.args[1], rsc) ||
          requested.args[2] !== params.percentToSwap || requested.args[3] !== params.priceThresholdWei) {
        return result('UNVERIFIED', 'Callback does not match the revision parameters.');
      }
      payload = encodeFunctionData({ abi, functionName: 'executeStopLoss', args: [rsc, rsc, requested.args[2], requested.args[3]] });
    }
    const requests = parseEventLogs({
      abi, eventName: 'CallbackRequest', logs: reaction.logs.filter(log => isAddressEqual(log.address, system)),
    }).filter(({ args }) => args.version === 0 && args.chainId === 84532n &&
      isAddressEqual(args.sender, rsc) && isAddressEqual(args.recipient, vault) &&
      args.configuration === encodeAbiParametersForCallback(callback.payload, vault, callback.gas_limit));
    if (requests.length !== 1) return result('UNVERIFIED', 'No unique system request matches the RSC callback.');

    const deliveries = records.filter(record => record.chainId === 84532n && isAddressEqual(record.requester, rsc) &&
      (record.txHash !== 0n || record.err !== '0x'));
    if (deliveries.length > 1) return result('UNVERIFIED', 'Multiple system delivery records match this reaction.');
    if (origin.blockNumber > finalized) return result('PENDING', 'Waiting for Base Sepolia finality.');
    const [delivery] = deliveries;
    let hash: Hash;
    if (delivery) {
      if (delivery.txHash !== 0n) report.destinationTxHash = numberToHex(delivery.txHash, { size: 32 });
      if (delivery.err !== '0x') return result('FAILED', 'The Reactive system recorded a delivery error.');
      hash = report.destinationTxHash as Hash;
      report.details.correlation = 'system';
    } else {
      const fallback = await findStopLossDelivery(base, {
        vault, proxy, payload, gasLimit: callback.gas_limit, cooldown: params.cooldownSeconds,
        executionId, originBlock: origin.blockNumber, reactionTimestamp: reactionBlock.timestamp, finalizedBlock: finalized,
      });
      if (fallback.status === 'pending') return report;
      if (fallback.status !== 'found') return result('UNVERIFIED', 'No unique callback can be matched to this reaction.');
      hash = fallback.hash;
      report.destinationTxHash = hash;
      report.details.correlation = 'receipt-window';
    }
    const [destination, transaction] = await Promise.all([
      base.getTransactionReceipt({ hash }), base.getTransaction({ hash }),
    ]);
    report.destinationBlockHash = destination.blockHash;
    if (destination.blockNumber > finalized) return result('PENDING', 'Waiting for Base Sepolia finality.');
    const destinationBlock = await base.getBlock({ blockNumber: destination.blockNumber });
    if (destination.blockHash !== destinationBlock.hash || transaction.blockHash !== destination.blockHash) {
      return result('REORGED', 'Callback receipt is outside the canonical Base chain.');
    }
    if (!transaction.to || !isAddressEqual(transaction.to, proxy) || destination.blockNumber < origin.blockNumber ||
        (destination.blockNumber === origin.blockNumber && destination.transactionIndex <= origin.transactionIndex)) {
      return result('UNVERIFIED', 'Destination transaction does not match the proxy and source order.');
    }
    const delivered = decodeFunctionData({ abi, data: transaction.input });
    if (delivered.functionName !== 'deliverCallback' || delivered.args[0] !== 0) {
      return result('UNVERIFIED', 'Unexpected callback selector or version.');
    }
    const [config] = decodeAbiParameters(configAbi, delivered.args[1]);
    if (config.chainId !== 84532n || !isAddressEqual(config.recipient, vault) ||
        config.gasLimit !== callback.gas_limit || config.payload !== payload) {
      return result('UNVERIFIED', 'Proxy calldata does not match the system callback.');
    }
    const failures = parseEventLogs({ abi, eventName: 'CallbackFailure',
      logs: destination.logs.filter(log => isAddressEqual(log.address, proxy)) });
    if (destination.status !== 'success' || failures.some(log => isAddressEqual(log.args.target, vault))) {
      return result('FAILED', 'The verified Vault callback failed.');
    }
    const logs = destination.logs.filter(log => isAddressEqual(log.address, vault));
    const skipped = parseEventLogs({ abi: vaultAbi, eventName: 'OrderSkipped', logs });
    const executed = parseEventLogs({ abi: ACTION_VAULT_ABI, eventName: 'StopLossExecuted', logs });
    const settled = profit ? parseEventLogs({ abi: PRICE_ORDER_VAULT_ABI, eventName: 'OrderSettled', logs }) : [];
    if (skipped.length + (profit ? settled.length : executed.length) !== 1) {
      return result('UNVERIFIED', 'Vault outcome is ambiguous.');
    }
    const token = await base.readContract({
      address: vault, abi: vaultAbi, functionName: 'usdcToken', blockNumber: destination.blockNumber,
    });
    const transfers = parseEventLogs({ abi, eventName: 'Transfer', logs: destination.logs.filter(log => isAddressEqual(log.address, token)) });
    if (skipped.length === 1 && executed.length === 0) {
      const { reason, currentPrice } = skipped[0].args;
      const validPriceSkip = profit ? reason === 'Price fell below take-profit threshold' && currentPrice < params.priceThresholdWei :
        reason === 'Price bounced back above stop threshold' && currentPrice > params.priceThresholdWei;
      if ((!validPriceSkip && !(profit && currentPrice === 0n && ['Order already settled', 'Callback expired'].includes(reason))) ||
          transfers.some(log => isAddressEqual(log.args.to, deployment.owner) || isAddressEqual(log.args.from, vault))) {
        return result('UNVERIFIED', 'The receipt does not prove the recorded skip without payout.');
      }
      report.details.executedPrice = currentPrice.toString();
      return result('SKIPPED', reason);
    }
    if (profit && (!isAddressEqual(settled[0].args.rsc, rsc) || settled[0].args.executionId !== executionId)) {
      return result('UNVERIFIED', 'The settled execution ID or RSC does not match.');
    }
    const ethAmountIn = profit ? settled[0].args.ethAmountIn : executed[0].args.ethAmountIn;
    const minUsdcOut = profit ? settled[0].args.minAmountOut : executed[0].args.minUsdcOut;
    const payouts = transfers.filter(log => isAddressEqual(log.args.to, deployment.owner) && log.args.value >= minUsdcOut);
    if (ethAmountIn === 0n || minUsdcOut === 0n || payouts.length !== 1) {
      return result('UNVERIFIED', 'Owner payout and minimum output could not be proven.');
    }
    report.details.amountIn = ethAmountIn.toString();
    report.details.amountOut = payouts[0].args.value.toString();
    return result('SUCCESS');
  }
}

function encodeAbiParametersForCallback(payload: Hex, recipient: `0x${string}`, gasLimit: bigint) {
  return encodeAbiParameters(configAbi, [{ chainId: 84532n, recipient, gasLimit, payload }]);
}

export const eventListenerService = new EventListenerService();
