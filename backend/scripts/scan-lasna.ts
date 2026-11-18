import { createPublicClient, http } from 'viem';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const lasna = {
  id: 5318007,
  name: 'Reactive Lasna',
  network: 'reactive-lasna',
  nativeCurrency: { name: 'Reactive', symbol: 'REACT', decimals: 18 },
  rpcUrls: { default: { http: [process.env.LASNA_RPC_URL || 'https://lasna-rpc.rnk.dev'] } }
} as const;

async function scanLasna() {
  const client = createPublicClient({ chain: lasna, transport: http() });
  const rsc = process.env.RSC_ADDRESS as `0x${string}`;
  const latest = await client.getBlockNumber();

  console.log(`Scanning Lasna from 8633090 to ${latest} for RSC: ${rsc}...`);
  for (let from = 8633090n; from <= latest; from += 100n) {
    const to = from + 99n > latest ? latest : from + 99n;
    try {
      const logs = await client.getLogs({
        address: rsc,
        fromBlock: from,
        toBlock: to
      });
      if (logs.length > 0) {
        console.log(`Found ${logs.length} logs in [${from} - ${to}]:`);
        for (const l of logs) {
          console.log('Tx:', l.transactionHash, 'Block:', l.blockNumber, 'Topics:', l.topics, 'Data:', l.data);
        }
      }
    } catch (e: any) {
      console.log(`Error at [${from} - ${to}]:`, e.message);
    }
  }
}

scanLasna().catch(console.error);
