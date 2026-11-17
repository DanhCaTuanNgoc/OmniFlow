import React from 'react';
import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { HeroCanvasPreview } from '@/components/landing/HeroCanvasPreview';
import { LiveTelemetry } from '@/components/landing/LiveTelemetry';
import { ArchitecturePillars } from '@/components/landing/ArchitecturePillars';
import { HonestyLedger } from '@/components/landing/HonestyLedger';
import { CallToAction } from '@/components/landing/CallToAction';
import { Footer } from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'OmniFlow — The Zapier of Web3: No-Code Cross-Chain Automation Powered by Reactive Omni',
  description:
    'Build autonomous event-driven triggers on Base Sepolia, execute logic on Reactive Omni Lasna, and trigger non-custodial ActionVault execution with zero off-chain keepers.',
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#08090D] text-slate-100 selection:bg-violet-500/30 selection:text-white relative overflow-x-hidden font-sans">
      {/* Fixed Navbar */}
      <Navbar />

      {/* Main Content Stream */}
      <main className="relative z-10">
        <Hero />
        <HeroCanvasPreview />
        <LiveTelemetry />
        <ArchitecturePillars />
        <HonestyLedger />
        <CallToAction />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
