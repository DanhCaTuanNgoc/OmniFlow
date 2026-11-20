import { STOP_LOSS_TEMPLATE, resolveStopLoss, type StopLossGraph } from './stopLossTemplate.js';

type GraphNode = StopLossGraph['nodes'][number];
type Address = `0x${string}`;
const { networks, syncTopic, maxSlippageBps } = STOP_LOSS_TEMPLATE;
const unichain = 1301;

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`DAG Validation Failed: ${message}`);
}

function address(value: unknown, field: string): Address {
  check(typeof value === 'string' && /^0x[0-9a-f]{40}$/i.test(value) && !/^0x0{40}$/i.test(value),
    `configure a valid ${field} address.`);
  return value.toLowerCase() as Address;
}

function int(value: unknown, field: string, min: number, max: number) {
  check(typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max,
    `${field} must be an integer between ${min} and ${max}.`);
  return value;
}

function scaledPrice(value: unknown) {
  const match = (typeof value === 'string' || typeof value === 'number' && value <= Number.MAX_SAFE_INTEGER)
    && /^(\d{1,18})(?:\.(\d{1,18}))?$/.exec(String(value));
  check(match, 'provide a positive decimal threshold with up to 18 digits on each side.');
  const result = BigInt(match[1]) * 10n ** 18n + BigInt((match[2] ?? '').padEnd(18, '0'));
  check(result > 0n, 'price threshold must be greater than zero.');
  return result;
}

function source(trigger: GraphNode, chain: number) {
  check([trigger.data.chainId, trigger.data.originChainId].every(value => value === undefined || value === chain),
    'the watcher chain must match the origin chain of this template.');
  check([trigger.data.customTopic0, trigger.data.topic0].every(value =>
    value === undefined || typeof value === 'string' && value.toLowerCase() === syncTopic),
  'the watcher must use the Uniswap V2 Sync topic.');
  return address(trigger.data.pairAddress, 'origin pool');
}

function price(node: GraphNode, operator: string) {
  check((node.data.operator ?? 'LESS_THAN_OR_EQUAL') === operator && (node.data.confirmationHits ?? 1) === 1,
    'use the template comparison operator and one hit per observation.');
  return scaledPrice(node.data.thresholdPriceUSD);
}

function parseLadder(value: unknown) {
  check(typeof value === 'string', 'configure the ladder as a list of threshold:percentage steps.');
  const entries = value.split(',');
  check(entries.length >= 2 && entries.length <= 8, 'a ladder must have two to eight steps.');
  const thresholds: bigint[] = [];
  const percentages: number[] = [];
  for (const entry of entries) {
    const [threshold, percent, extra] = entry.trim().split(':');
    check(extra === undefined && /^\d{1,3}$/.test(percent ?? ''), 'use threshold:percentage for each ladder step.');
    const next = scaledPrice(threshold);
    check(thresholds.length === 0 || thresholds[thresholds.length - 1] > next, 'ladder thresholds must descend.');
    thresholds.push(next);
    percentages.push(int(Number(percent), 'ladder percentage', 1, 100));
  }
  check(percentages.reduce((sum, percent) => sum + percent, 0) <= 100, 'ladder percentages must sum to at most 100%.');
  return { thresholds, percentages };
}

export function isPhaseTwoGraph(graph: StopLossGraph) {
  return graph.nodes.some(node => node.type === 'logicGate' || node.type === 'priceVelocityGuard'
    || node.type === 'priceThresholdGuard' && node.data.operator === 'GREATER_THAN_OR_EQUAL'
    || node.type === 'dexSwap' && ['ONE_SHOT', 'LADDER'].some(policy => policy === node.data.executionPolicy));
}

export function resolvePhaseTwo(graph: StopLossGraph) {
  const { nodes, edges } = graph;
  const of = (type: string) => nodes.filter(node => node.type === type);
  const swaps = of('dexSwap');
  const [swap] = swaps;
  const cooldowns = of('cooldownGuard');
  const [cooldown] = cooldowns;
  const policy = swap?.data.executionPolicy;
  check(swaps.length === 1 && cooldowns.length <= 1, 'use one DEX swap and an optional cooldown.');
  check(new Set(nodes.map(node => node.id)).size === nodes.length && new Set(edges.map(edge => edge.id)).size === edges.length,
    'node and edge IDs must be unique.');
  check((swap.data.fromToken ?? 'ETH') === 'ETH' && (swap.data.toToken ?? 'USDC') === 'USDC'
    && (swap.data.maxSlippagePercent ?? maxSlippageBps / 100) === maxSlippageBps / 100,
  'Phase 2 uses an ETH to USDC Vault with a fixed 5% slippage cap.');
  check(policy === undefined || policy === 'REPEAT' || policy === 'ONE_SHOT' || policy === 'LADDER',
    'unknown order policy.');
  const vault = address(swap.data.actionVaultAddress, 'Phase 2 Vault');
  const cooldownSeconds = int(cooldown?.data.cooldownSeconds ?? 300, 'cooldown', 0, 0xffffffff);
  const connects = (from: GraphNode, to: GraphNode, port?: string) => edges.some(edge =>
    edge.source === from.id && edge.target === to.id && edge.sourceHandle == null && (edge.targetHandle ?? undefined) === port);
  const finalize = (from: GraphNode) => cooldown
    ? connects(from, cooldown) && connects(cooldown, swap) : connects(from, swap);
  const verifyNetworks = (originChainId: number) => check(!graph.networks || (
    graph.networks.originChainId === originChainId && graph.networks.reactiveChainId === networks.reactiveChainId
    && graph.networks.destinationChainId === networks.destinationChainId), 'network fields disagree.');

  const [gate] = of('logicGate');
  const watchers = of('watchDEXPrice');
  const thresholds = of('priceThresholdGuard');
  if (gate) {
    verifyNetworks(networks.originChainId);
    check(policy === undefined || policy === 'REPEAT', 'price gates use the repeat policy.');
    check(gate.data.gateType === 'AND' || gate.data.gateType === 'OR', 'choose AND or OR.');
    check(watchers.length === 2 && thresholds.length === 2 && nodes.length === 6 + cooldowns.length
      && edges.length === nodes.length - 1 && finalize(gate), 'use two price watchers with one threshold each feeding a Logic Gate.');
    const branches = ['signal-a', 'signal-b'].map(port => {
      const node = thresholds.find(candidate => connects(candidate, gate, port));
      const watcher = node && watchers.find(candidate => connects(candidate, node));
      check(node && watcher, 'connect independent price branches to Signal A and Signal B.');
      return { pool: source(watcher, networks.originChainId), threshold: price(node, 'LESS_THAN_OR_EQUAL') };
    });
    const [primary, confirmation] = branches;
    check(primary.pool !== confirmation.pool, 'the two signals must use different Base Sepolia pools.');
    return {
      type: 'price-gate' as const, vaultPool: primary.pool,
      config: {
        primaryPool: primary.pool, confirmationPool: confirmation.pool, vault,
        primaryThreshold: primary.threshold, confirmationThreshold: confirmation.threshold,
        freshnessSeconds: int(gate.data.freshnessSeconds ?? 15, 'freshness', 1, 180), cooldownSeconds,
        requireBoth: gate.data.gateType === 'AND',
      },
      percent: int(swap.data.amountPercentage, 'swap percentage', 1, 100),
    };
  }

  const [watcher] = watchers;
  const [velocity] = of('priceVelocityGuard');
  const [thresholdNode] = thresholds;
  const condition = velocity ?? thresholdNode;
  check(watchers.length === 1 && condition && nodes.length === 3 + cooldowns.length && edges.length === nodes.length - 1
    && connects(watcher, condition) && finalize(condition), 'connect one watcher to one price condition and one DEX swap.');
  const originChain = velocity ? unichain : networks.originChainId;
  verifyNetworks(originChain);
  const originPool = source(watcher, originChain);
  const takeProfit = thresholdNode?.data.operator === 'GREATER_THAN_OR_EQUAL';
  const ladder = policy === 'LADDER';
  check(velocity || takeProfit || ladder || policy === 'ONE_SHOT', 'use a supported Phase 2 order.');
  check(!velocity && !takeProfit || (policy === undefined || policy === 'REPEAT'), 'this price condition uses the repeat policy.');
  const ladderConfig = ladder ? parseLadder(swap.data.ladderSchedule) : undefined;
  const threshold = velocity ? 0n : price(condition, takeProfit ? 'GREATER_THAN_OR_EQUAL' : 'LESS_THAN_OR_EQUAL');
  if (ladderConfig) check(threshold === ladderConfig.thresholds[0], 'set the price condition to the first ladder threshold.');
  if (velocity) check(velocity.data.direction === 'DROP', 'cross-chain hedge requires downward velocity.');
  const percent = ladder ? 0 : int(swap.data.amountPercentage, 'swap percentage', 1, 100);
  return {
    type: 'price-order' as const,
    vaultPool: velocity ? address(swap.data.destinationPoolAddress, 'Base destination pool') : originPool,
    config: {
      originPool, vault, originChainId: BigInt(originChain), mode: ladder ? 3 : velocity ? 2 : takeProfit ? 1 : 0,
      threshold, percent, cooldown: cooldownSeconds,
      dropBps: velocity ? int(velocity.data.velocityThresholdBps, 'velocity threshold', 1, 10_000) : 0,
      windowSeconds: velocity ? int(velocity.data.windowSeconds, 'velocity window', 1, 0xffffffff) : 0,
    },
    ladder: ladderConfig,
  };
}

export function resolvePipeline(graph: StopLossGraph) {
  return isPhaseTwoGraph(graph)
    ? { template: 'phase-two-v1' as const, params: resolvePhaseTwo(graph) }
    : { template: 'stop-loss-v1' as const, params: resolveStopLoss(graph) };
}
