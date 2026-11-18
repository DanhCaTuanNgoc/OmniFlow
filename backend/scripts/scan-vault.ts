import { createPublicClient, http } from 'viem';
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

async function scanVaultLogs() {
  const baseClient = createPublicClient({ chain: baseSepolia, transport: http() });
  const vault = process.env.VAULT_ADDRESS as `0x${string}`;
  const latest = await baseClient.getBlockNumber();

  console.log(`Scanning Vault logs from block 60315600 to ${latest} in 150-block batches...`);

  for (let from = 60315600n; from <= latest; from += 150n) {
    const to = from + 149n > latest ? latest : from + 149n;
    try {
      const logs = await baseClient.getLogs({
        address: vault,
        fromBlock: from,
        toBlock: to
      });
      if (logs.length > 0) {
        console.log(`Found ${logs.length} logs in [${from} - ${to}]:`);
        for (const log of logs) {
          console.log('Log Tx:', log.transactionHash, 'Block:', log.blockNumber, 'Topics:', log.topics);
        }
      }
    } catch (e: any) {
      console.log(`Error at [${from} - ${to}]:`, e.message);
    }
  }
}

scanVaultLogs().catch(console.error);
