import { createPublicClient, encodeDeployData, encodeFunctionData, formatEther, getAddress, http, isAddressEqual, parseAbi, type Address, type PublicClient } from '../backend/node_modules/viem';
import { config } from '../backend/node_modules/dotenv';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import evidence from '../FULL_LOOP_EVIDENCE.json';
import {
  PRICE_GATE_PIPELINE_ABI, PRICE_GATE_PIPELINE_BYTECODE,
  PRICE_ORDER_PIPELINE_ABI, PRICE_ORDER_PIPELINE_BYTECODE, PRICE_ORDER_VAULT_ABI, STOP_LOSS_TEMPLATE, resolvePhaseTwo,
} from '../packages/shared/src/index';
import { PipelineGraphSchema } from '../backend/src/schemas/pipeline.schema';
import { PRICE_ORDER_VAULT_RUNTIME } from '../backend/src/abis/runtimeFingerprints';
import { matchesRuntime } from '../backend/src/services/runtimeBytecode';

config({ path: resolve(__dirname, '../backend/.env') });

type Client = Pick<PublicClient, 'getChainId' | 'getBalance' | 'getCode' | 'getGasPrice' | 'estimateGas' | 'readContract' | 'call'>;
const ethereumSepoliaRpc = 'https://ethereum-sepolia-rpc.publicnode.com';
const unichainRpc = process.env.UNICHAIN_SEPOLIA_RPC_URL || 'https://sepolia.unichain.org';
const lasnaRpc = process.env.LASNA_RPC_URL || 'https://lasna-rpc.rnk.dev';
const baseRpc = process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';

async function balance(network: string, rpc: string, expectedChain: number, address: Address) {
  const client: Client = createPublicClient({ transport: http(rpc, { timeout: 10_000 }) });
  const [chain, amount] = await Promise.all([client.getChainId(), client.getBalance({ address })]);
  if (chain !== expectedChain) throw new Error(`${network} RPC returned chain ${chain}.`);
  return { client, amount };
}

type Fixture = { owner: Address; resolved: ReturnType<typeof resolvePhaseTwo> };
type Candidate = { name: string; data: `0x${string}`; hedge: boolean; fixture?: Fixture };
const marketAbi = parseAbi([
  'function token0() view returns (address)', 'function token1() view returns (address)',
  'function decimals() view returns (uint8)', 'function WETH() view returns (address)',
  'function getReserves() view returns (uint112, uint112, uint32)',
]);

async function verifyPool(client: Client, address: Address, expectedTokens?: [Address, Address]) {
  const [token0, token1, reserves] = await Promise.all([
    client.readContract({ address, abi: marketAbi, functionName: 'token0' }),
    client.readContract({ address, abi: marketAbi, functionName: 'token1' }),
    client.readContract({ address, abi: marketAbi, functionName: 'getReserves' }),
  ]);
  const decimals: number[] = await Promise.all([token0, token1].map(token =>
    client.readContract({ address: token, abi: marketAbi, functionName: 'decimals' })));
  if (reserves[0] === 0n || reserves[1] === 0n || isAddressEqual(token0, token1) || decimals.some(value => value !== 18)) {
    throw new Error(`Pool ${address} requires nonzero reserves and two distinct 18-decimal tokens.`);
  }
  if (expectedTokens && (!isAddressEqual(token0, expectedTokens[0]) || !isAddressEqual(token1, expectedTokens[1]))) {
    throw new Error(`Pool ${address} does not use the expected token order.`);
  }
}

async function verifyFixture({ owner, resolved }: Fixture, base: Client, unichain: Client | undefined) {
  const address = resolved.config.vault;
  const vault = { address, abi: PRICE_ORDER_VAULT_ABI } as const;
  const code = await base.getCode({ address });
  if (!matchesRuntime(code, PRICE_ORDER_VAULT_RUNTIME)) throw new Error('Base Vault runtime does not match this Phase 2 artifact.');
  const [vaultOwner, pair, router, quote, proxyCode, ownerBalance] = await Promise.all([
    base.readContract({ ...vault, functionName: 'owner' }),
    base.readContract({ ...vault, functionName: 'tokenPair' }),
    base.readContract({ ...vault, functionName: 'uniswapRouter' }),
    base.readContract({ ...vault, functionName: 'usdcToken' }),
    base.getCode({ address: STOP_LOSS_TEMPLATE.callbackProxy }),
    base.getBalance({ address: owner }),
  ]);
  if (!isAddressEqual(owner, vaultOwner) || !isAddressEqual(pair, resolved.vaultPool)) {
    throw new Error('Base Vault owner or settlement pool differs from the supplied graph.');
  }
  if (!proxyCode || proxyCode === '0x') throw new Error('Base callback proxy bytecode is unavailable.');
  if (ownerBalance === 0n) throw new Error('Base Vault owner has zero ETH for onboarding gas.');
  await base.call({ to: address, account: STOP_LOSS_TEMPLATE.callbackProxy,
    data: encodeFunctionData({ abi: vault.abi, functionName: 'pay', args: [0n] }) });
  const weth = await base.readContract({ address: router, abi: marketAbi, functionName: 'WETH' });
  const checks = [verifyPool(base, pair, [weth, quote])];
  if (resolved.type === 'price-gate') checks.push(verifyPool(base, resolved.config.confirmationPool, [weth, quote]));
  if (resolved.type === 'price-order' && resolved.config.mode === 2 && unichain) {
    checks.push(verifyPool(unichain, resolved.config.originPool));
  }
  await Promise.all(checks);
}

function historicalQuotes(): Candidate[] {
  // These addresses reproduce the constructor cost shape for budgeting only.
  const prior = Object.values(evidence.cooldowns)[0];
  const gatePool = getAddress(prior.pair);
  const otherPool = getAddress(evidence.demo.contracts.originPair.address);
  const vault = getAddress(prior.vault);
  const price = (value: number) => BigInt(value) * 10n ** 18n;
  const orders = [
    { name: 'One-shot', mode: 0, threshold: price(1800), originChainId: 84532n, percent: 50, dropBps: 0, windowSeconds: 0 },
    { name: 'Take-profit', mode: 1, threshold: price(2800), originChainId: 84532n, percent: 50, dropBps: 0, windowSeconds: 0 },
    { name: 'Cross-chain hedge', mode: 2, threshold: 0n, originChainId: 1301n, percent: 50, dropBps: 500, windowSeconds: 10 },
    { name: 'Ladder', mode: 3, threshold: price(1800), originChainId: 84532n, percent: 0, dropBps: 0, windowSeconds: 0 },
  ].map(({ name, ...params }) => ({
    name, hedge: params.mode === 2,
    data: encodeDeployData({
      abi: PRICE_ORDER_PIPELINE_ABI, bytecode: PRICE_ORDER_PIPELINE_BYTECODE,
      args: [{ originPool: gatePool, vault, cooldown: 300, ...params }],
    }),
  }));
  const gates = [true, false].map(requireBoth => ({
    name: requireBoth ? 'AND' : 'OR', hedge: false,
    data: encodeDeployData({
      abi: PRICE_GATE_PIPELINE_ABI, bytecode: PRICE_GATE_PIPELINE_BYTECODE,
      args: [{
        primaryPool: gatePool, confirmationPool: otherPool, vault,
        primaryThreshold: price(1800), confirmationThreshold: price(1800),
        freshnessSeconds: 15, cooldownSeconds: 300, requireBoth,
      }],
    }),
  }));
  return [...orders, ...gates];
}

async function quoteGraph(file: string): Promise<Candidate> {
  const graph = PipelineGraphSchema.parse(JSON.parse(await readFile(resolve(file), 'utf8')));
  const candidate = resolvePhaseTwo(graph);
  const data = candidate.type === 'price-gate'
    ? encodeDeployData({ abi: PRICE_GATE_PIPELINE_ABI, bytecode: PRICE_GATE_PIPELINE_BYTECODE, args: [candidate.config] })
    : encodeDeployData({ abi: PRICE_ORDER_PIPELINE_ABI, bytecode: PRICE_ORDER_PIPELINE_BYTECODE, args: [candidate.config] });
  return { name: graph.metadata.name, data, hedge: candidate.type === 'price-order' && candidate.config.mode === 2,
    fixture: { owner: getAddress(graph.metadata.ownerAddress), resolved: candidate } };
}

function errorMessage(error: unknown) {
  const message = error instanceof Error
    ? ('shortMessage' in error ? error.shortMessage : error.message) : error;
  return String(message).replace(/https?:\/\/\S+/g, '[RPC URL]');
}

async function main() {
  const { values, positionals } = parseArgs({
    options: { graph: { type: 'string', multiple: true }, 'origin-signer': { type: 'string' } },
    allowPositionals: true,
  });
  const input = positionals[0] || process.env.RELAYER_ADDRESS;
  if (!input || positionals.length > 1) {
    throw new Error('Pass one public Lasna signer address or configure RELAYER_ADDRESS.');
  }
  const address = getAddress(input);
  const originSigner = values['origin-signer'] ? getAddress(values['origin-signer']) : address;
  const graphs = values.graph ?? [];
  const graphResults = await Promise.allSettled(graphs.map(quoteGraph));
  const candidates = graphs.length ? graphResults.flatMap((result, index) => {
    if (result.status === 'fulfilled') return [result.value];
    console.error(`Graph ${graphs[index]}: ${errorMessage(result.reason)}`);
    return [];
  }) : historicalQuotes();
  if (!candidates.length) throw new Error('No valid Phase 2 graphs to quote.');
  const [lasna, base, unichain, sepolia] = await Promise.allSettled([
    balance('Lasna', lasnaRpc, 5318007, address),
    balance('Base Sepolia', baseRpc, 84532, address),
    candidates.some(candidate => candidate.hedge)
      ? balance('Unichain Sepolia', unichainRpc, 1301, originSigner) : Promise.resolve(null),
    balance('Ethereum Sepolia', ethereumSepoliaRpc, 11155111, address),
  ]);
  for (const [network, unit, result] of [
    ['Base Sepolia', 'ETH', base], ['Unichain Sepolia', 'ETH', unichain], ['Ethereum Sepolia', 'ETH', sepolia],
    ['Lasna', 'lREACT', lasna],
  ] as const) {
    if (result.status === 'rejected') console.log(`${network}: RPC unavailable (${errorMessage(result.reason)}).`);
    else if (result.value) console.log(`${network}: ${formatEther(result.value.amount)} ${unit}.`);
  }
  if (lasna.status === 'rejected') throw lasna.reason;
  const { client, amount } = lasna.value;
  const system = await client.getCode({ address: STOP_LOSS_TEMPLATE.omniSystem });
  if (!system || system === '0x') throw new Error('Lasna Omni system is unavailable.');
  const gasPrice = await client.getGasPrice();
  const [estimates, fixtures] = await Promise.all([
    Promise.allSettled(candidates.map(async ({ data }) => {
      const gas = await client.estimateGas({ account: address, data, value: 0n, gasPrice, type: 'legacy' });
      return STOP_LOSS_TEMPLATE.fundingWei + ((gas * 120n + 99n) / 100n) * gasPrice;
    })),
    Promise.allSettled(candidates.map(async ({ fixture }) => {
      if (fixture && base.status === 'fulfilled') {
        await verifyFixture(fixture, base.value.client, unichain.status === 'fulfilled' ? unichain.value?.client : undefined);
      }
    })),
  ]);
  let total = 0n;
  let blocked = graphResults.some(result => result.status === 'rejected');
  console.table(estimates.map((result, index) => {
    const { name, hedge } = candidates[index];
    if (result.status === 'rejected') {
      blocked = true;
      return { name, estimate: 'Unavailable', blockers: errorMessage(result.reason) };
    }
    total += result.value;
    const blockers: string[] = [];
    if (amount < result.value) blockers.push(`Lasna short by ${formatEther(result.value - amount)} lREACT`);
    if (base.status === 'rejected') blockers.push('Base RPC unavailable');
    else if (!candidates[index].fixture && base.value.amount === 0n) blockers.push('Base wallet has zero ETH');
    if (hedge && unichain.status === 'rejected') blockers.push('Unichain RPC unavailable');
    if (hedge && unichain.status === 'fulfilled' && unichain.value?.amount === 0n) blockers.push('Unichain signer has zero ETH');
    const fixture = fixtures[index];
    if (fixture.status === 'rejected') blockers.push(errorMessage(fixture.reason));
    blocked ||= blockers.length > 0;
    return { name, estimate: `${formatEther(result.value)} lREACT`, blockers: blockers.join(' | ') };
  }));
  console.log(`Total for quoted RSCs: ${formatEther(total)} lREACT.`);
  console.log(values.graph?.length ? 'Constructor estimates use the supplied graphs.' : 'Constructor estimates use historical addresses for cost comparison.');
  console.log('Acceptance also requires funded principal, callback reserves and verified execution receipts.');
  if (blocked || amount < total) process.exitCode = 2;
}

main().catch(error => {
  console.error(errorMessage(error));
  process.exitCode = 1;
});
