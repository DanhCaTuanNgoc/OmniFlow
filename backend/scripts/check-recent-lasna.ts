import { createPublicClient, http } from 'viem';

const lasna = {
  id: 5318007,
  name: 'Reactive Lasna',
  network: 'reactive-lasna',
  nativeCurrency: { name: 'Reactive', symbol: 'REACT', decimals: 18 },
  rpcUrls: { default: { http: ['https://lasna-rpc.rnk.dev'] } }
};

async function checkRecentLasna() {
  const client = createPublicClient({ chain: lasna, transport: http() });
  const rsc = '0x8c2d098617102a64925cc683d9b444f938a96082' as `0x${string}`;
  const head = await client.getBlockNumber();

  console.log(`Checking Lasna logs for ${rsc} from 8633640 to ${head}...`);
  const logs = await client.getLogs({
    address: rsc,
    fromBlock: 8633640n,
    toBlock: head
  });
  console.log(`Logs found: ${logs.length}`);
  for (const l of logs) {
    console.log('Tx:', l.transactionHash, 'Block:', l.blockNumber, 'Topic 0:', l.topics[0]);
  }
}

checkRecentLasna().catch(console.error);
