/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@omniflow/shared'],
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@xyflow/react',
      'viem',
      'wagmi',
      '@tanstack/react-query',
      '@omniflow/shared',
    ],
  },
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@x402/evm/upto/client': false,
      '@x402/evm/exact/client': false,
      '@x402/core/client': false,
      '@x402/svm/exact/client': false,
      '@x402/evm': false,
    };
    return config;
  },
};

export default nextConfig;
