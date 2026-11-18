import { createPublicClient, http } from 'viem';

const baseSepolia = {
  id: 84532,
  name: 'Base Sepolia',
  network: 'base-sepolia',
  nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://sepolia.base.org'] } }
};

async function checkTx() {
  const client = createPublicClient({ chain: baseSepolia, transport: http() });
  const tx1 = '0xdc7ccb62a64940e78438805735e4cdd7194285a327d91e8db4215f839ef0c73e';
  const tx2 = '0x603fccd601f7b0a7aba967324b6f3245045561cdaba12cf68474ecc7f65fe1bf';

  const r1 = await client.getTransactionReceipt({ hash: tx1 });
  console.log('Tx1 Status:', r1.status, 'Block:', r1.blockNumber, 'Logs count:', r1.logs.length);
  for (const l of r1.logs) {
    console.log('Tx1 Log:', l.address, l.topics);
  }

  const r2 = await client.getTransactionReceipt({ hash: tx2 });
  console.log('Tx2 Status:', r2.status, 'Block:', r2.blockNumber, 'Logs count:', r2.logs.length);
  for (const l of r2.logs) {
    console.log('Tx2 Log:', l.address, l.topics);
  }
}

checkTx().catch(console.error);
