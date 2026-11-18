import { createWalletClient, createPublicClient, http, parseEther, parseAbiItem } from 'viem';
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

async function depositToProxy() {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
  const account = privateKeyToAccount(privateKey);
  const client = createPublicClient({ chain: baseSepolia, transport: http() });
  const wallet = createWalletClient({ account, chain: baseSepolia, transport: http() });

  const proxy = '0xa6eA49Ed671B8a4dfCDd34E36b7a75Ac79B8A5a6' as `0x${string}`;
  const vault = process.env.VAULT_ADDRESS as `0x${string}`;

  console.log(`Depositing 0.0005 ETH to CallbackProxy [${proxy}] for Vault [${vault}]...`);

  const txHash = await wallet.writeContract({
    address: proxy,
    abi: [parseAbiItem('function depositTo(address _contract) external payable')],
    functionName: 'depositTo',
    args: [vault],
    value: parseEther('0.0005')
  });

  console.log(`Tx Hash: ${txHash}`);
  const receipt = await client.waitForTransactionReceipt({ hash: txHash });
  console.log(`Confirmed in block: #${receipt.blockNumber}, status: ${receipt.status}`);

  const reserves = await client.readContract({
    address: proxy,
    abi: [parseAbiItem('function reserves(address) view returns (uint256)')],
    functionName: 'reserves',
    args: [vault]
  });
  console.log(`Vault reserves on CallbackProxy is now: ${reserves} wei`);
}

depositToProxy().catch(console.error);
