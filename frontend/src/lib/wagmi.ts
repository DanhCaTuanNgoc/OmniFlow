import { fallback, http, createConfig, injected } from 'wagmi';
import { baseSepoliaChain, reactiveLasnaChain } from './chains';

export const wagmiConfig = createConfig({
  chains: [baseSepoliaChain, reactiveLasnaChain],
  connectors: [
    injected({
      target: 'metaMask',
    }),
  ],
  transports: {
    [baseSepoliaChain.id]: fallback([
      http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://base-sepolia-rpc.publicnode.com'),
      http('https://sepolia.base.org'),
    ]),
    [reactiveLasnaChain.id]: http('https://lasna-rpc.rnk.dev'),
  },
  ssr: true,
});
