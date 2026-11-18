import { createPublicClient, http } from 'viem';

const lasna = {
  id: 5318007,
  name: 'Reactive Lasna',
  network: 'reactive-lasna',
  nativeCurrency: { name: 'Reactive', symbol: 'REACT', decimals: 18 },
  rpcUrls: { default: { http: ['https://lasna-rpc.rnk.dev'] } }
};

async function checkReactiveTx() {
  const client = createPublicClient({ chain: lasna, transport: http() });
  const hash = '0xec28373c12498a272027da2b40ade8fa72af3eba8d7569c4b98de2792a2b7ea5' as `0x${string}`;

  const receipt = await client.getTransactionReceipt({ hash });
  console.log('Status:', receipt.status);
  console.log('Block Number:', receipt.blockNumber);
  console.log('Logs count:', receipt.logs.length);
  for (const l of receipt.logs) {
    console.log('Log Address:', l.address);
    console.log('Topics:', l.topics);
    console.log('Data:', l.data);
  }
}

checkReactiveTx().catch(console.error);
