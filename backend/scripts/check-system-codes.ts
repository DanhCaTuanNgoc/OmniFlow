import { createPublicClient, http } from 'viem';

const lasna = {
  id: 5318007,
  name: 'Reactive Lasna',
  network: 'reactive-lasna',
  nativeCurrency: { name: 'Reactive', symbol: 'REACT', decimals: 18 },
  rpcUrls: { default: { http: ['https://lasna-rpc.rnk.dev'] } }
};

async function checkCodes() {
  const client = createPublicClient({ chain: lasna, transport: http() });

  const addr1 = '0x0000000000000000000000000000000000ffffff' as `0x${string}`;
  const addr2 = '0x8888888888888888888888888888888888888888' as `0x${string}`;

  const code1 = await client.getBytecode({ address: addr1 });
  const code2 = await client.getBytecode({ address: addr2 });

  console.log('Code at 0x000...ffffff:', code1 ? `${code1.slice(0, 40)}... (len: ${code1.length})` : 'EMPTY');
  console.log('Code at 0x888...888888:', code2 ? `${code2.slice(0, 40)}... (len: ${code2.length})` : 'EMPTY');
}

checkCodes().catch(console.error);
