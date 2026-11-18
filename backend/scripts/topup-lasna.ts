import { createWalletClient, createPublicClient, http, parseEther, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const baseSepolia = {
  id: 84532,
  name: 'Base Sepolia',
  network: 'base-sepolia',
  nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'] } }
};

const FAUCET_ADDR = '0x2afaFD298b23b62760711756088F75B7409f5967' as `0x${string}`;

async function topUp() {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
  const account = privateKeyToAccount(privateKey);
  const client = createPublicClient({ chain: baseSepolia, transport: http() });
  const wallet = createWalletClient({ account, chain: baseSepolia, transport: http() });

  const balBefore = await client.getBalance({ address: account.address });
  console.log(`Balance before: ${formatEther(balBefore)} ETH`);

  console.log(`Sending 0.003 ETH to Reactive Faucet contract: ${FAUCET_ADDR}...`);
  const hash = await wallet.sendTransaction({
    to: FAUCET_ADDR,
    value: parseEther('0.003')
  });

  console.log(`Faucet Tx Hash: ${hash}`);
  const receipt = await client.waitForTransactionReceipt({ hash });
  console.log(`Confirmed on Base Sepolia block: #${receipt.blockNumber}`);
}

topUp().catch(console.error);
