import { createPublicClient, encodeDeployData, formatEther, getAddress, http, type Address } from '../backend/node_modules/viem';
import { config } from '../backend/node_modules/dotenv';
import { resolve } from 'node:path';
import evidence from '../FULL_LOOP_EVIDENCE.json';
import {
  PRICE_GATE_PIPELINE_ABI, PRICE_GATE_PIPELINE_BYTECODE,
  PRICE_ORDER_PIPELINE_ABI, PRICE_ORDER_PIPELINE_BYTECODE, STOP_LOSS_TEMPLATE,
} from '../packages/shared/src/index';

config({ path: resolve(__dirname, '../backend/.env') });

const ethereumSepoliaRpc = 'https://ethereum-sepolia-rpc.publicnode.com';
const unichainRpc = process.env.UNICHAIN_SEPOLIA_RPC_URL || 'https://sepolia.unichain.org';
const lasnaRpc = process.env.LASNA_RPC_URL || 'https://lasna-rpc.rnk.dev';
const baseRpc = process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';

async function balance(network: string, rpc: string, expectedChain: number, address: Address) {
  const client = createPublicClient({ transport: http(rpc, { timeout: 10_000 }) });
  const [chain, amount] = await Promise.all([client.getChainId(), client.getBalance({ address })]);
  if (chain !== expectedChain) throw new Error(`${network} RPC returned chain ${chain}.`);
  return { client, amount };
}

async function main() {
  const input = process.argv[2] || process.env.RELAYER_ADDRESS;
  if (!input) throw new Error('Pass a public testnet signer address or configure RELAYER_ADDRESS.');
  const address = getAddress(input);
  const [base, lasna, unichain, sepolia] = await Promise.all([
    balance('Base Sepolia', baseRpc, 84532, address),
    balance('Lasna', lasnaRpc, 5318007, address),
    balance('Unichain Sepolia', unichainRpc, 1301, address),
    balance('Ethereum Sepolia', ethereumSepoliaRpc, 11155111, address),
  ]);
  const system = await lasna.client.getCode({ address: STOP_LOSS_TEMPLATE.omniSystem });
  if (!system || system === '0x') throw new Error('Lasna Omni system is unavailable.');

  // Constructors only register subscriptions. Historical fixture addresses are used to quote gas.
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
    name,
    data: encodeDeployData({
      abi: PRICE_ORDER_PIPELINE_ABI, bytecode: PRICE_ORDER_PIPELINE_BYTECODE,
      args: [{ originPool: gatePool, vault, cooldown: 300, ...params }],
    }),
  }));
  const gates = [true, false].map(requireBoth => ({
    name: requireBoth ? 'AND' : 'OR',
    data: encodeDeployData({
      abi: PRICE_GATE_PIPELINE_ABI, bytecode: PRICE_GATE_PIPELINE_BYTECODE,
      args: [{
        primaryPool: gatePool, confirmationPool: otherPool, vault,
        primaryThreshold: price(1800), confirmationThreshold: price(1800),
        freshnessSeconds: 15, cooldownSeconds: 300, requireBoth,
      }],
    }),
  }));
  const gasPrice = await lasna.client.getGasPrice();
  const estimates = await Promise.all([...orders, ...gates].map(async ({ name, data }) => {
    const gas = await lasna.client.estimateGas({ account: address, data, value: 0n, gasPrice, type: 'legacy' });
    const budget = STOP_LOSS_TEMPLATE.fundingWei + ((gas * 120n + 99n) / 100n) * gasPrice;
    return { name, budget };
  }));
  const required = estimates.reduce((sum, row) => sum + row.budget, 0n);
  console.log(`Base Sepolia: ${formatEther(base.amount)} ETH; Unichain Sepolia: ${formatEther(unichain.amount)} ETH.`);
  console.log(`Lasna: ${formatEther(lasna.amount)} lREACT; Ethereum Sepolia: ${formatEther(sepolia.amount)} ETH.`);
  console.table(estimates.map(({ name, budget }) => ({ name, 'lREACT including constructor value': formatEther(budget) })));
  console.log(`Budget for six RSCs: ${formatEther(required)} lREACT. Deployment estimates exclude Vault principal and callback reserves.`);
  if (lasna.amount < required || unichain.amount === 0n) {
    console.log('Funding blocked: top up Lasna and the Unichain origin signer before running the full testnet suite.');
    process.exitCode = 2;
  }
}

main().catch(error => {
  const message = error.shortMessage ?? error.message ?? String(error);
  console.error(String(message).replace(/https?:\/\/\S+/g, '[RPC URL]'));
  process.exitCode = 1;
});
