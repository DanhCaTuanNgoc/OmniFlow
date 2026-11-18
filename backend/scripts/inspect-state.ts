import { createPublicClient, http, parseAbiItem, formatEther } from 'viem';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const baseSepolia = {
  id: 84532,
  name: 'Base Sepolia',
  network: 'base-sepolia',
  nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'] } }
} as const;

const lasna = {
  id: 5318007,
  name: 'Reactive Lasna',
  network: 'reactive-lasna',
  nativeCurrency: { name: 'Reactive', symbol: 'REACT', decimals: 18 },
  rpcUrls: { default: { http: [process.env.LASNA_RPC_URL || 'https://lasna-rpc.rnk.dev'] } }
} as const;

async function check() {
  const baseClient = createPublicClient({ chain: baseSepolia, transport: http() });
  const lasnaClient = createPublicClient({ chain: lasna, transport: http() });

  const vault = process.env.VAULT_ADDRESS as `0x${string}`;
  const rsc = process.env.RSC_ADDRESS as `0x${string}`;
  const pair = process.env.PAIR_ADDRESS as `0x${string}`;

  console.log('--- Contracts Under Inspection ---');
  console.log('Vault:', vault);
  console.log('RSC:', rsc);
  console.log('Pair:', pair);

  const baseLatest = await baseClient.getBlockNumber();
  const lasnaLatest = await lasnaClient.getBlockNumber();
  console.log(`Base Sepolia Block: #${baseLatest}`);
  console.log(`Reactive Lasna Block: #${lasnaLatest}`);

  // 1. Check Vault status
  const isAuth = await baseClient.readContract({
    address: vault,
    abi: [parseAbiItem('function authorizedRSCs(address) view returns (bool)')],
    functionName: 'authorizedRSCs',
    args: [rsc]
  });
  console.log(`Authorized RSC on Vault [${rsc}]:`, isAuth);

  const vaultEth = await baseClient.getBalance({ address: vault });
  console.log(`Vault ETH Balance: ${formatEther(vaultEth)} ETH`);

  // 2. Check RSC balance on Lasna
  const rscBalance = await lasnaClient.getBalance({ address: rsc });
  console.log(`RSC Balance on Lasna: ${formatEther(rscBalance)} REACT`);

  // 3. Check Pair reserves
  const reserves = await baseClient.readContract({
    address: pair,
    abi: [parseAbiItem('function getReserves() view returns (uint112, uint112, uint32)')],
    functionName: 'getReserves'
  });
  console.log(`Pair Reserves: reserve0=${reserves[0]}, reserve1=${reserves[1]}`);

  // 4. Check Vault Logs
  const fromBlock = baseLatest > 150n ? baseLatest - 150n : 0n;
  const vaultLogs = await baseClient.getLogs({
    address: vault,
    fromBlock,
    toBlock: baseLatest
  });
  console.log(`Vault Logs in last 150 blocks (Block #${fromBlock} - #${baseLatest}): ${vaultLogs.length}`);
  for (const log of vaultLogs) {
    console.log('Vault Log Topics:', log.topics, 'Tx:', log.transactionHash);
  }

  // 5. Check Lasna Logs
  const lasnaFrom = lasnaLatest > 100n ? lasnaLatest - 100n : 0n;
  try {
    const lasnaLogs = await lasnaClient.getLogs({
      address: rsc,
      fromBlock: lasnaFrom,
      toBlock: lasnaLatest
    });
    console.log(`Lasna RSC Logs (last 100 blocks): ${lasnaLogs.length}`);
    for (const log of lasnaLogs) {
      console.log('Lasna Log Topics:', log.topics, 'Tx:', log.transactionHash);
    }
  } catch (err: any) {
    console.log('Lasna logs error:', err.message);
  }
}

check().catch(console.error);
