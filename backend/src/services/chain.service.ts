import {
  createPublicClient,
  createWalletClient,
  http,
  formatEther,
  type PublicClient,
  type WalletClient,
  type Account,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { env } from '../config/env.js';
import { baseSepoliaChain, reactiveLasnaChain } from '../config/chains.js';

export class ChainService {
  public readonly basePublicClient: PublicClient;
  public readonly lasnaPublicClient: PublicClient;
  public readonly relayerAccount?: Account;
  public readonly lasnaWalletClient?: WalletClient;

  constructor() {
    // 1. Khởi tạo Public Client cho Base Sepolia
    this.basePublicClient = createPublicClient({
      chain: baseSepoliaChain,
      transport: http(env.BASE_SEPOLIA_RPC_URL),
    });

    // 2. Khởi tạo Public Client cho Reactive Lasna
    this.lasnaPublicClient = createPublicClient({
      chain: reactiveLasnaChain,
      transport: http(env.LASNA_RPC_URL),
    });

    // 3. Khởi tạo Wallet Client cho Relayer nếu có Private Key
    if (env.RELAYER_PRIVATE_KEY) {
      this.relayerAccount = privateKeyToAccount(
        env.RELAYER_PRIVATE_KEY as `0x${string}`
      );
      this.lasnaWalletClient = createWalletClient({
        account: this.relayerAccount,
        chain: reactiveLasnaChain,
        transport: http(env.LASNA_RPC_URL),
      });
    }
  }

  /**
   * Lấy số dư lREACT của ví Relayer trên Lasna
   */
  async getRelayerLasnaBalance(): Promise<{
    address: string;
    balanceWei: bigint;
    balanceFormatted: string;
  } | null> {
    if (!this.relayerAccount) return null;

    const balanceWei = await this.lasnaPublicClient.getBalance({
      address: this.relayerAccount.address,
    });

    return {
      address: this.relayerAccount.address,
      balanceWei,
      balanceFormatted: formatEther(balanceWei),
    };
  }

  /**
   * Kiểm tra tình trạng kết nối song song cả 2 mạng
   */
  async checkHealth(): Promise<{
    baseSepolia: { ok: boolean; blockNumber: bigint; chainId: number };
    reactiveLasna: { ok: boolean; blockNumber: bigint; chainId: number };
  }> {
    const [baseBlock, lasnaBlock] = await Promise.all([
      this.basePublicClient.getBlockNumber().catch(() => 0n),
      this.lasnaPublicClient.getBlockNumber().catch(() => 0n),
    ]);

    return {
      baseSepolia: {
        ok: baseBlock > 0n,
        blockNumber: baseBlock,
        chainId: baseSepoliaChain.id,
      },
      reactiveLasna: {
        ok: lasnaBlock > 0n,
        blockNumber: lasnaBlock,
        chainId: reactiveLasnaChain.id,
      },
    };
  }
}

// Singleton instance
export const chainService = new ChainService();
