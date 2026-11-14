import React from 'react';
import type { Metadata } from 'next';
import { Web3Provider } from '@/components/providers/Web3Provider';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'OmniFlow — The Zapier of Web3',
  description:
    'No-Code Cross-Chain Automation Powered by Reactive Omni. Autonomous DEX Stop-Loss, Anti-Drainer SafeSweep & Cross-Chain Oracles.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#070B12] text-slate-100 min-h-screen antialiased">
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
