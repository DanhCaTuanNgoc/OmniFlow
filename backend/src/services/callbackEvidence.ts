import { decodeAbiParameters, decodeFunctionData, isAddressEqual, parseAbi, parseAbiItem, parseAbiParameters,
  type Address, type Hash, type Hex, type PublicClient } from 'viem';

const proxyAbi = parseAbi(['function deliverCallback(uint8,bytes)']);
export const callbackConfiguration = parseAbiParameters('(uint256 chainId, address recipient, uint64 gasLimit, bytes payload)');
const outcomes = [
  parseAbiItem('event StopLossExecuted(uint256 ethAmountIn, uint256 minUsdcOut, uint256 timestamp)'),
  parseAbiItem('event OrderSkipped(string reason, uint256 currentPrice)'),
];
const evidenceWindowSeconds = 180n;

export async function findStopLossDelivery(
  base: PublicClient,
  criteria: { vault: Address; proxy: Address; payload: Hex; gasLimit: bigint; cooldown: bigint;
    originBlock: bigint; reactionTimestamp: bigint; finalizedBlock: bigint },
): Promise<{ status: 'pending' | 'unverified' } | { status: 'found'; hash: Hash }> {
  // Repeated requests from this RSC have identical calldata. Only use a time window shorter than its cooldown.
  if (criteria.cooldown < evidenceWindowSeconds) return { status: 'unverified' };
  const cap = criteria.originBlock + 2_000n;
  const end = criteria.finalizedBlock < cap ? criteria.finalizedBlock : cap;
  if (end < criteria.originBlock) return { status: 'pending' };
  const deadline = criteria.reactionTimestamp + evidenceWindowSeconds;
  if ((await base.getBlock({ blockNumber: end })).timestamp < deadline) {
    return { status: end === cap ? 'unverified' : 'pending' };
  }

  async function firstBlockAt(timestamp: bigint) {
    let low = criteria.originBlock;
    let high = end;
    while (low < high) {
      const mid = (low + high) / 2n;
      if ((await base.getBlock({ blockNumber: mid })).timestamp < timestamp) low = mid + 1n;
      else high = mid;
    }
    return low;
  }

  const [start, excluded] = await Promise.all([
    firstBlockAt(criteria.reactionTimestamp), firstBlockAt(deadline),
  ]);
  const candidates = new Set<Hash>();
  for (let cursor = start; cursor < excluded;) {
    const toBlock = cursor + 9n < excluded ? cursor + 9n : excluded - 1n;
    const logs = await base.getLogs({ address: criteria.vault, events: outcomes, fromBlock: cursor, toBlock, strict: true });
    for (const hash of new Set(logs.map(log => log.transactionHash))) {
      const tx = await base.getTransaction({ hash });
      if (!tx.to || !isAddressEqual(tx.to, criteria.proxy)) continue;
      try {
        const call = decodeFunctionData({ abi: proxyAbi, data: tx.input });
        if (call.args[0] !== 0) continue;
        const [configuration] = decodeAbiParameters(callbackConfiguration, call.args[1]);
        if (configuration.chainId === 84532n && configuration.gasLimit === criteria.gasLimit &&
            isAddressEqual(configuration.recipient, criteria.vault) && configuration.payload === criteria.payload) {
          candidates.add(hash);
        }
      } catch {
        // Other proxy methods cannot prove delivery of the Omni request.
      }
    }
    if (candidates.size > 1) return { status: 'unverified' };
    cursor = toBlock + 1n;
  }
  const [hash] = candidates;
  return hash ? { status: 'found', hash } : { status: 'unverified' };
}
