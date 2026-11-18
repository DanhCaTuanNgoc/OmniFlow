import { createPublicClient, http, parseAbiItem, formatEther } from 'viem';

const baseSepolia = {
  id: 84532,
  name: 'Base Sepolia',
  network: 'base-sepolia',
  nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://sepolia.base.org'] } }
};

async function checkProxyState() {
  const client = createPublicClient({ chain: baseSepolia, transport: http() });
  const proxy = '0xa6eA49Ed671B8a4dfCDd34E36b7a75Ac79B8A5a6' as `0x${string}`;
  const vault = '0x005d4cB896c9e0B07Bbf961FDC26b098D84079d7' as `0x${string}`;

  try {
    const debt = await client.readContract({
      address: proxy,
      abi: [parseAbiItem('function debt(address) view returns (uint256)')],
      functionName: 'debt',
      args: [vault]
    });
    console.log('Vault Debt on CallbackProxy:', debt);
  } catch (e: any) {
    console.log('Error debt:', e.message);
  }

  try {
    const reserves = await client.readContract({
      address: proxy,
      abi: [parseAbiItem('function reserves(address) view returns (uint256)')],
      functionName: 'reserves',
      args: [vault]
    });
    console.log('Vault Reserves on CallbackProxy:', reserves);
  } catch (e: any) {
    console.log('Error reserves:', e.message);
  }
}

checkProxyState().catch(console.error);
