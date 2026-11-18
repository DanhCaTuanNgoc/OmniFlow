import { createWalletClient, createPublicClient, http, parseAbiItem } from 'viem';
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

async function authorizeNewRSC() {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
  const account = privateKeyToAccount(privateKey);
  const client = createPublicClient({ chain: baseSepolia, transport: http() });
  const wallet = createWalletClient({ account, chain: baseSepolia, transport: http() });

  const vault = process.env.VAULT_ADDRESS as `0x${string}`;
  const newRSC = '0x8c2d098617102a64925cc683d9b444f938a96082' as `0x${string}`;

  console.log(`Authorizing new RSC [${newRSC}] on Vault [${vault}]...`);

  const txHash = await wallet.writeContract({
    address: vault,
    abi: [parseAbiItem('function setAuthorizedRSC(address _rsc, bool _status) external')],
    functionName: 'setAuthorizedRSC',
    args: [newRSC, true]
  });

  console.log(`Tx sent: ${txHash}`);
  const receipt = await client.waitForTransactionReceipt({ hash: txHash });
  console.log(`Confirmed in block: #${receipt.blockNumber}, status: ${receipt.status}`);

  const isAuth = await client.readContract({
    address: vault,
    abi: [parseAbiItem('function authorizedRSCs(address) view returns (bool)')],
    functionName: 'authorizedRSCs',
    args: [newRSC]
  });
  console.log(`Verification: authorizedRSCs[${newRSC}] = ${isAuth}`);
}

authorizeNewRSC().catch(console.error);
