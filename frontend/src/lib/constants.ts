export const APP_CONFIG = {
  name: 'OmniFlow',
  tagline: 'The Zapier of Web3',
  description: 'No-Code Cross-Chain Automation Powered by Reactive Omni',
  backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/stream',
};

export const CONTRACT_ADDRESSES = {
  // Official Reactive Network System & Proxy Addresses
  CALLBACK_PROXY_BASE_SEPOLIA: '0xa6eA49Ed671B8a4dfCDd34E36b7a75Ac79B8A5a6' as `0x${string}`,
  SYSTEM_CONTRACT_LASNA: '0x0000000000000000000000000000000000fffFfF' as `0x${string}`,

  // Deployed Testbed Contracts on Base Sepolia
  DEFAULT_ACTION_VAULT: (process.env.NEXT_PUBLIC_ACTION_VAULT_ADDRESS ||
    '0xABCDEF0123456789ABCDEF0123456789ABCDEF01') as `0x${string}`,
  DEFAULT_PAIR_ETH_USDC: (process.env.NEXT_PUBLIC_PAIR_ADDRESS ||
    '0x1234567890123456789012345678901234567890') as `0x${string}`,
};

export const SUPPORTED_PAIRS = [
  { label: 'ETH / USDC', address: CONTRACT_ADDRESSES.DEFAULT_PAIR_ETH_USDC, base: 'ETH', quote: 'USDC' },
  { label: 'WBTC / USDC', address: '0x2345678901234567890123456789012345678901', base: 'WBTC', quote: 'USDC' },
  { label: 'REACT / ETH', address: '0x3456789012345678901234567890123456789012', base: 'REACT', quote: 'ETH' },
];
