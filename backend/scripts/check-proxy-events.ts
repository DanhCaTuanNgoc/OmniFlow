import { createPublicClient, http } from 'viem';

const baseSepolia = {
  id: 84532,
  name: 'Base Sepolia',
  network: 'base-sepolia',
  nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://sepolia.base.org'] } }
};

async function checkProxyEvents() {
  const client = createPublicClient({ chain: baseSepolia, transport: http() });
  const proxy = '0xa6eA49Ed671B8a4dfCDd34E36b7a75Ac79B8A5a6' as `0x${string}`;
  const head = await client.getBlockNumber();

  console.log(`Checking logs from CallbackProxy ${proxy} from ${head - 150n} to ${head}...`);
  const logs = await client.getLogs({
    address: proxy,
    fromBlock: head - 150n,
    toBlock: head
  });
  console.log('Logs count on proxy:', logs.length);
  for (const l of logs) {
    console.log('Tx:', l.transactionHash, 'Topics:', l.topics, 'Data:', l.data);
  }
}

checkProxyEvents().catch(console.error);
