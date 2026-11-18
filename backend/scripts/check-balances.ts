import { createPublicClient, http, formatEther } from 'viem';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const lasna = {
  id: 5318007,
  name: 'Reactive Lasna',
  network: 'reactive-lasna',
  nativeCurrency: { name: 'Reactive', symbol: 'REACT', decimals: 18 },
  rpcUrls: { default: { http: ['https://lasna-rpc.rnk.dev'] } }
};

const baseSepolia = {
  id: 84532,
  name: 'Base Sepolia',
  network: 'base-sepolia',
  nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://sepolia.base.org'] } }
};

async function checkBalances() {
  const lasnaClient = createPublicClient({ chain: lasna, transport: http() });
  const baseClient = createPublicClient({ chain: baseSepolia, transport: http() });

  const address = '0xE50dD8e4aE1b1Dd46334eA22C10129Ee4d6736eF';
  const lasnaBal = await lasnaClient.getBalance({ address });
  const baseBal = await baseClient.getBalance({ address });

  console.log('Deployer Wallet:', address);
  console.log('Lasna Balance:', formatEther(lasnaBal), 'REACT');
  console.log('Base Sepolia Balance:', formatEther(baseBal), 'ETH');
}

checkBalances().catch(console.error);
