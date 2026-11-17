'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Terminal, Play } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
      {/* Top Orbital Pulsing Badge */}
      <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-violet-50/90 border border-violet-200/90 shadow-[0_2px_10px_rgba(124,58,237,0.08)] mb-8 transition-transform hover:scale-105 select-none">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-600" />
        </span>
        <span className="text-xs font-mono font-medium tracking-wide text-violet-900">
          Reactive Omni Buildathon · <span className="text-violet-700 font-semibold">Set It and Forget It Track</span>
        </span>
      </div>

      {/* Main Headline (Editorial Serif / Sans contrast with Obsidian Violet Gradient) */}
      <h1 className="text-4xl sm:text-6xl lg:text-7xl font-light tracking-tight text-slate-900 max-w-5xl mx-auto leading-[1.08] mb-6 font-sans">
        Compose Cross-Chain Logic.{' '}
        <span className="font-normal italic text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-700">
          Zero Code.
        </span>{' '}
        <br className="hidden sm:inline" />
        True Inversion of Control.
      </h1>

      {/* Subtitle / Value Proposition */}
      <p className="text-base sm:text-xl text-slate-600 max-w-3xl mx-auto font-normal leading-relaxed mb-10">
        The <span className="text-slate-900 font-semibold">Zapier of Web3</span>. Autonomous{' '}
        <span className="text-violet-700 font-semibold">Reactive Smart Contracts (RSC)</span> on Lasna listen to Base Sepolia
        events and trigger non-custodial <span className="text-indigo-700 font-semibold">ActionVault</span> callbacks with{' '}
        <span className="text-emerald-600 font-semibold">zero off-chain keepers</span>.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
        <Link
          href="/workspace/studio"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-mono font-semibold uppercase tracking-wider text-white bg-violet-600 hover:bg-violet-700 shadow-[0_4px_18px_rgba(124,58,237,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>Launch Pipeline Studio</span>
          <ArrowRight className="w-4 h-4" />
        </Link>

        <a
          href="#how-it-works"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-mono font-semibold uppercase tracking-wider text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Play className="w-4 h-4 text-violet-600 fill-violet-600" />
          <span>Interactive Demo</span>
        </a>

        <a
          href="#proof"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-mono font-semibold uppercase tracking-wider text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Terminal className="w-4 h-4 text-emerald-600" />
          <span>On-Chain Proof</span>
        </a>
      </div>

      {/* Headline Metric Cards (Canary Style 4-Block Strip, Pristine Light Theme) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200/80 border border-slate-200/90 rounded-2xl overflow-hidden max-w-4xl mx-auto shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-md">
        <div className="bg-white/95 p-5 text-left">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1">Keeper Model</div>
          <div className="text-2xl font-semibold tracking-tight text-slate-900 font-mono flex items-center gap-2">
            0 Keepers
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-sans font-medium">
              Pure RSC
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">No Gelato or Chainlink bots</p>
        </div>

        <div className="bg-white/95 p-5 text-left">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1">E2E Loop Latency</div>
          <div className="text-2xl font-semibold tracking-tight text-violet-700 font-mono">
            &lt; 3.2s
          </div>
          <p className="text-xs text-slate-500 mt-1">Base Sepolia ⇄ Reactive Lasna</p>
        </div>

        <div className="bg-white/95 p-5 text-left">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1">Storm Resistance</div>
          <div className="text-2xl font-semibold tracking-tight text-indigo-700 font-mono">
            200ms Guard
          </div>
          <p className="text-xs text-slate-500 mt-1">Stateless cooldown timestamp</p>
        </div>

        <div className="bg-white/95 p-5 text-left">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1">Custody Model</div>
          <div className="text-2xl font-semibold tracking-tight text-emerald-600 font-mono flex items-center gap-1.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            100% Safe
          </div>
          <p className="text-xs text-slate-500 mt-1">Emergency Panic Sweep anytime</p>
        </div>
      </div>
    </section>
  );
}
