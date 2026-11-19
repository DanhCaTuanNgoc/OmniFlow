export const APP_CONFIG = {
  name: 'OmniFlow',
  tagline: 'The Zapier of Web3',
  description: 'No-Code Cross-Chain Automation Powered by Reactive Omni',
  backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/stream',
};

export const CONTRACT_ADDRESSES = {
  // Official Reactive Network System & Proxy Addresses
  CALLBACK_PROXY_BASE_SEPOLIA: '0xa6eA49Ed671B8a4dfCDd34E36b7a75Ac79B8A5a6' as `0x${string}`,
  SYSTEM_CONTRACT_LASNA: '0x0000000000000000000000000000000000fffFfF' as `0x${string}`,

  // Deployed Testbed Contracts on Base Sepolia
  DEFAULT_ACTION_VAULT: (process.env.NEXT_PUBLIC_ACTION_VAULT_ADDRESS ||
    '0x005d4cb896c9e0B07Bbf961FDC26b098D84079d7') as `0x${string}`,
  DEFAULT_PAIR_ETH_USDC: (process.env.NEXT_PUBLIC_PAIR_ADDRESS ||
    '0x9a796b794999cabcd10d08f777b24ceb76e34b3e') as `0x${string}`,
  DEFAULT_RSC_STOP_LOSS: (process.env.NEXT_PUBLIC_RSC_ADDRESS ||
    '0x8c2d098617102a64925cc683d9b444f938a96082') as `0x${string}`,
  DEFAULT_BACKUP_SAFE_SWEEP: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as `0x${string}`,
};

export const SUPPORTED_CHAINS = [
  { id: 84532, name: 'Base Sepolia', shortName: 'Base', testnet: true, explorerUrl: 'https://sepolia.basescan.org' },
  { id: 1301, name: 'Unichain Sepolia', shortName: 'Unichain', testnet: true, explorerUrl: 'https://sepolia.uniscan.xyz' },
  { id: 5318007, name: 'Reactive Lasna', shortName: 'Lasna', testnet: true, explorerUrl: 'https://lasna.reactscan.net' },
];

export const SUPPORTED_PAIRS = [
  { label: 'ETH / USDC', address: CONTRACT_ADDRESSES.DEFAULT_PAIR_ETH_USDC, base: 'ETH', quote: 'USDC' },
];
