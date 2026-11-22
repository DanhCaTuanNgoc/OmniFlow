export const STOP_LOSS_TEMPLATE = {
  id: 'stop-loss',
  version: 1,
  networks: { originChainId: 84532, reactiveChainId: 5318007, destinationChainId: 84532 },
  syncTopic: '0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1',
  callbackProxy: '0x476f44b11f5c942c58f4c8e3d0300e5710743585',
  omniSystem: '0x8888888888888888888888888888888888888888',
  maxSlippageBps: 500,
  fundingWei: 200_000_000_000_000_000n,
} as const;

export interface StopLossGraph {
  nodes: readonly { id: string; type?: string; data: Record<string, unknown> }[];
  edges: readonly {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
  }[];
  networks?: { originChainId: number; reactiveChainId: number; destinationChainId: number };
}

export class StopLossValidationError extends Error {
  constructor(message: string, readonly nodeId?: string) {
    super(`DAG Validation Failed: ${message}`);
  }
}

function check(condition: unknown, message: string, nodeId?: string): asserts condition {
  if (!condition) throw new StopLossValidationError(message, nodeId);
}

function address(value: unknown, label: string, nodeId: string): `0x${string}` {
  check(typeof value === 'string' && /^0x[\da-f]{40}$/i.test(value) && !/^0x0{40}$/i.test(value),
    `configure a valid ${label} address.`, nodeId);
  return value.toLowerCase() as `0x${string}`;
}

function integer(value: unknown, label: string, nodeId: string | undefined, min: number, max = Number.MAX_SAFE_INTEGER): bigint {
  check(typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max,
    `${label} must be an integer between ${min} and ${max}.`, nodeId);
  return BigInt(value);
}

function threshold(value: unknown, nodeId: string): bigint {
  check(typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value) && value <= Number.MAX_SAFE_INTEGER),
    'provide a positive price threshold.', nodeId);
  const parts = /^(\d{1,18})(?:\.(\d{1,18}))?$/.exec(String(value));
  check(parts, 'price threshold must be a decimal with up to 18 digits on each side.', nodeId);
  const scaled = BigInt(parts[1]) * 10n ** 18n + BigInt((parts[2] ?? '').padEnd(18, '0'));
  check(scaled > 0n, 'price threshold must be greater than zero.', nodeId);
  return scaled;
}

export function resolveStopLoss(graph: StopLossGraph) {
  const { nodes, edges, networks } = graph;
  const nodeByType = new Map(nodes.map(node => [node.type, node]));
  const trigger = nodeByType.get('watchDEXPrice');
  const price = nodeByType.get('priceThresholdGuard');
  const cooldown = nodeByType.get('cooldownGuard');
  const action = nodeByType.get('dexSwap');
  const path = cooldown ? [trigger, price, cooldown, action] : [trigger, price, action];
  check(path.every(node => node !== undefined) && nodes.length === path.length
    && new Set(nodes.map(node => node.id)).size === nodes.length,
  'use one DEX price trigger, one price threshold, an optional cooldown, and one DEX swap.');
  check(edges.length === path.length - 1 && new Set(edges.map(edge => edge.id)).size === edges.length
    && path.slice(1).every((node, index) => edges.some(edge =>
      edge.source === path[index]?.id && edge.target === node?.id && edge.sourceHandle == null && edge.targetHandle == null)),
  'connect the stop-loss nodes in order using their default ports.');
  check(trigger && price && action, 'required stop-loss nodes are missing.');

  const baseChain = STOP_LOSS_TEMPLATE.networks.originChainId;
  const origin = trigger.data.originChainId ?? trigger.data.chainId ?? networks?.originChainId ?? baseChain;
  check([trigger.data.chainId, trigger.data.originChainId, networks?.originChainId]
    .every(chain => chain === undefined || chain === origin),
  'origin chain fields disagree. Select the origin chain again.', trigger.id);
  check(origin === baseChain, 'only Base Sepolia stop-loss through Lasna is available for deployment.', trigger.id);
  check(!networks || (
    networks.destinationChainId === STOP_LOSS_TEMPLATE.networks.destinationChainId &&
    networks.reactiveChainId === STOP_LOSS_TEMPLATE.networks.reactiveChainId),
  'only Base Sepolia stop-loss through Lasna is available for deployment.');
  check([trigger.data.customTopic0, trigger.data.topic0].every(topic =>
    topic === undefined || (typeof topic === 'string' && topic.toLowerCase() === STOP_LOSS_TEMPLATE.syncTopic)),
  'the price watcher must use the Uniswap V2 Sync topic.', trigger.id);
  const pairAddress = address(trigger.data.pairAddress, 'origin pool', trigger.id);
  check((price.data.operator ?? 'LESS_THAN_OR_EQUAL') === 'LESS_THAN_OR_EQUAL',
    'stop-loss requires a less-than-or-equal price threshold.', price.id);
  const priceThresholdWei = threshold(price.data.thresholdPriceUSD ?? 1800, price.id);
  const requiredHits = integer(price.data.confirmationHits ?? 1, 'confirmation hits', price.id, 1);
  const cooldownSeconds = integer(cooldown?.data.cooldownSeconds ?? 300, 'cooldown', cooldown?.id, 0);
  check((action.data.fromToken ?? 'ETH') === 'ETH' && (action.data.toToken ?? 'USDC') === 'USDC',
    'the stop-loss Vault supports ETH to USDC.', action.id);
  check(action.data.executionPolicy === undefined || action.data.executionPolicy === 'REPEAT',
    'one-shot and ladder orders require the Phase 2 Vault and testnet acceptance.', action.id);
  check(action.data.maxSlippagePercent === undefined ||
    action.data.maxSlippagePercent === STOP_LOSS_TEMPLATE.maxSlippageBps / 100,
  'this Vault has a fixed 5% slippage cap. Apply the Vault limit in the DEX Swap inspector.', action.id);

  return {
    pairAddress,
    priceThresholdWei,
    cooldownSeconds,
    percentToSwap: integer(action.data.amountPercentage ?? 50, 'swap percentage', action.id, 1, 100),
    actionVaultAddress: address(action.data.actionVaultAddress, 'ActionVault', action.id),
    requiredHits,
    velocityThresholdBps: 0n,
    windowSeconds: 0n,
    originChainId: BigInt(origin),
    originTopic0: STOP_LOSS_TEMPLATE.syncTopic,
  };
}

export function stopLossConstructorArgs(config: ReturnType<typeof resolveStopLoss>) {
  return [
    config.pairAddress, config.priceThresholdWei, config.cooldownSeconds, config.percentToSwap,
    config.actionVaultAddress, config.requiredHits, config.velocityThresholdBps,
    config.windowSeconds, config.originChainId, BigInt(config.originTopic0),
  ] as const;
}
