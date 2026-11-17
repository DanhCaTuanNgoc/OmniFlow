import React from 'react';
import type { Metadata } from 'next';
import { Web3Provider } from '@/components/providers/Web3Provider';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'OmniFlow — The Zapier of Web3',
  description:
    'No-Code Cross-Chain Automation Powered by Reactive Omni. Modern Obsidian FinTech Studio for DEX Stop-Loss & SafeSweep.',
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
    <html lang="en">
      <body className="min-h-screen antialiased selection:bg-violet-500/30 selection:text-white">
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
