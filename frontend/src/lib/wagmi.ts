import { http, createConfig, injected } from 'wagmi';
import { baseSepoliaChain, reactiveLasnaChain } from './chains';

export const wagmiConfig = createConfig({
  chains: [baseSepoliaChain, reactiveLasnaChain],
  connectors: [
    injected({
      target: 'metaMask',
    }),
  ],
  transports: {
    [baseSepoliaChain.id]: http('https://sepolia.base.org'),
    [reactiveLasnaChain.id]: http('https://lasna-rpc.rnk.dev'),
  },
  ssr: true,
});
