import { defineChain } from 'viem';

/**
 * Cấu hình chuỗi Base Sepolia (Chain ID: 84532)
 * Đặc trưng: 200ms block time sau bản nâng cấp Denim
 */
export const baseSepoliaChain = defineChain({
  id: 84532,
  name: 'Base Sepolia',
  nativeCurrency: {
    name: 'Sepolia Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://sepolia.base.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Basescan',
      url: 'https://sepolia.basescan.org',
    },
  },
  testnet: true,
});

/**
 * Cấu hình chuỗi Reactive Lasna Testnet (Chain ID: 5318007)
 * Đặc trưng: CometBFT consensus, ~1s block time, Instant Finality
 */
export const reactiveLasnaChain = defineChain({
  id: 5318007,
  name: 'Reactive Lasna',
  nativeCurrency: {
    name: 'Lasna REACT',
    symbol: 'lREACT',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://lasna-rpc.rnk.dev'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Reactscan',
      url: 'https://lasna.reactscan.net',
    },
  },
  testnet: true,
});
