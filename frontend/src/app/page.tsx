import React from 'react';
import type { Metadata } from 'next';
import { PageBackground } from '@/components/landing/PageBackground';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { HeroCanvasPreview } from '@/components/landing/HeroCanvasPreview';
import { SurfacesWall } from '@/components/landing/SurfacesWall';
import { LiveTelemetry } from '@/components/landing/LiveTelemetry';
import { ArchitecturePillars } from '@/components/landing/ArchitecturePillars';
import { SimplerCTA } from '@/components/landing/SimplerCTA';
import { HonestyLedger } from '@/components/landing/HonestyLedger';
import { Footer } from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'OmniFlow — The Zapier of Web3: No-Code Cross-Chain Automation Powered by Reactive Omni',
  description:
    'Build autonomous event-driven triggers on Base Sepolia, execute logic on Reactive Omni Lasna, and trigger non-custodial ActionVault execution with zero off-chain keepers.',
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#08090D] text-white selection:bg-violet-500/30 selection:text-white relative overflow-x-hidden font-sans">
      {/* 1. Luminous Ambient Photographic Layer + Vector Horizon */}
      <PageBackground />

      {/* 2. Scroll-Morphing Floating Pill Navbar with Spring Follower */}
      <Navbar />

      {/* 3. Main Content Stream */}
      <main className="relative z-10">
        {/* Hero Section: Orbit comets + Title frames + Button wings + Metric strip */}
        <Hero />

        {/* Hero Stage: 3-Act Synchronized Interactive Canvas Preview */}
        <HeroCanvasPreview />

        {/* Live Surfaces Wall: macOS Magnifying Dock with Motion */}
        <SurfacesWall />

        {/* Live Multi-Chain Telemetry (Base Sepolia 200ms Denim + Reactive Lasna) */}
        <LiveTelemetry />

        {/* Architecture Pillars: Clean Canary Ghost Cards & Hairline Dividers */}
        <ArchitecturePillars />

        {/* Simpler CTA: High-Fidelity Pastel Gradient Card */}
        <SimplerCTA />

        {/* Honesty Ledger: Verifiable On-Chain Evidence & Judge Verification */}
        <HonestyLedger />
      </main>

      {/* 4. Minimalist FinTech Footer */}
      <Footer />
    </div>
  );
}
