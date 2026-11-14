import { defineChain } from 'viem';

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
    public: {
      http: ['https://sepolia.base.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BaseScan',
      url: 'https://sepolia.basescan.org',
    },
  },
  testnet: true,
});

export const reactiveLasnaChain = defineChain({
  id: 5318007,
  name: 'Reactive Lasna',
  nativeCurrency: {
    name: 'Reactive Ether',
    symbol: 'lREACT',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://lasna-rpc.rnk.dev'],
    },
    public: {
      http: ['https://lasna-rpc.rnk.dev'],
    },
  },
  blockExplorers: {
    default: {
      name: 'ReactScan',
      url: 'https://lasna.reactscan.net',
    },
  },
  testnet: true,
});
