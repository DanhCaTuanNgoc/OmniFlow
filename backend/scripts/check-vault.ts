import { createPublicClient, http } from 'viem';

const baseSepolia = {
  id: 84532,
  name: 'Base Sepolia',
  network: 'base-sepolia',
  nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://sepolia.base.org'] } }
};

async function checkVault() {
  const client = createPublicClient({ chain: baseSepolia, transport: http() });
  const vault = '0x005d4cB896c9e0B07Bbf961FDC26b098D84079d7' as `0x${string}`;

  const bal = await client.getBalance({ address: vault });
  console.log('Vault Balance:', bal);

  // Check code
  const code = await client.getBytecode({ address: vault });
  console.log('Vault Code length:', code?.length);
}

checkVault().catch(console.error);
