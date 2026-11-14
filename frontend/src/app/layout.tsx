import React from 'react';
import type { Metadata } from 'next';
import { Web3Provider } from '@/components/providers/Web3Provider';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'OmniFlow — The Zapier of Web3',
  description:
    'Tactical Zero-Radius Mission Control for Cross-Chain Automation Powered by Reactive Omni.',
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
      <body className="bg-[#06040A] text-zinc-100 min-h-screen antialiased selection:bg-[#8B5CF6]/30 selection:text-white">
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
