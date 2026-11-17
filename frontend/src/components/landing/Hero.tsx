'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Terminal, Play, Zap } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative pt-28 md:pt-36 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center isolate overflow-hidden">
      {/* 1. Canary Rotating Orbit System */}
      <div className="hero-orbit w-16 h-16 relative mx-auto mb-6">
        <div className="overlay blur-[2px]">
          <div
            style={{ animationDelay: '0s' } as React.CSSProperties}
            className="hero-orbit-item opacity-80"
          />
          <div
            style={{ animationDelay: '-0.4s' } as React.CSSProperties}
            className="hero-orbit-item -rotate-[60deg] opacity-80"
          />
          <div
            style={{ animationDelay: '-0.8s' } as React.CSSProperties}
            className="hero-orbit-item -rotate-[120deg] opacity-80"
          />
          <div className="hero-background-dot w-2 h-2 bg-white rounded-full" />
        </div>
        <div className="overlay">
          <div
            style={{ animationDelay: '0s' } as React.CSSProperties}
            className="hero-orbit-item"
          />
          <div
            style={{ animationDelay: '-0.4s' } as React.CSSProperties}
            className="hero-orbit-item -rotate-[60deg]"
          />
          <div
            style={{ animationDelay: '-0.8s' } as React.CSSProperties}
            className="hero-orbit-item -rotate-[120deg]"
          />
          <div className="hero-background-dot w-2 h-2 bg-white rounded-full shadow-[0_0_10px_#ffffff]" />
        </div>
      </div>

      {/* 2. Top Specular Badge */}
      <div className="flex gap-2 items-center rounded-full py-1.5 px-4 bg-white/10 w-max mx-auto text-xs font-mono mb-8 shadow-badge-dark backdrop-blur-md select-none transition-transform hover:scale-105">
        <svg fill="none" height="14" viewBox="0 0 14 14" width="14" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M8.16791 1.40103C8.16791 0.535288 7.04509 0.195336 6.56487 0.915664L1.85985 7.97319C1.4722 8.55467 1.88904 9.33355 2.5879 9.33355H5.83458V12.5994C5.83458 13.4651 6.9574 13.8051 7.43762 13.0848L12.1426 6.02725C12.5303 5.44576 12.1135 4.66688 11.4146 4.66688H8.16791V1.40103Z"
            fill="url(#badge_grad)"
          />
          <defs>
            <linearGradient id="badge_grad" x1="7" x2="7" y1="0.5" y2="13.5" gradientUnits="userSpaceOnUse">
              <stop stopColor="white" />
              <stop offset="1" stopColor="#C084FC" />
            </linearGradient>
          </defs>
        </svg>
        <span className="text-white/90 font-medium">
          Reactive Omni Buildathon · <span className="text-violet-300 font-semibold">Set It & Forget It</span>
        </span>
      </div>

      {/* 3. Main Headline Flanked by 4 Decorative Frames */}
      <div className="relative max-w-5xl mx-auto mb-6">
        {/* Desktop Title Vector Frames */}
        <div className="hidden lg:block pointer-events-none select-none">
          <img
            alt=""
            src="/assets/images/hero/title-frame-1.png"
            width="348"
            aria-hidden="true"
            className="absolute -left-48 -top-16 opacity-75"
          />
          <img
            alt=""
            src="/assets/images/hero/title-frame-2.png"
            width="348"
            aria-hidden="true"
            className="absolute -right-48 -top-16 opacity-75"
          />
          <img
            alt=""
            src="/assets/images/hero/description-frame-1.png"
            width="252"
            aria-hidden="true"
            className="absolute -left-36 top-14 opacity-60"
          />
          <img
            alt=""
            src="/assets/images/hero/description-frame-2.png"
            width="252"
            aria-hidden="true"
            className="absolute -right-36 top-14 opacity-60"
          />
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-[-0.03em] text-white max-w-4xl mx-auto leading-[1.08] relative z-10 font-sans">
          Compose Cross-Chain Logic.{' '}
          <span className="font-normal italic text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-indigo-200 to-cyan-300">
            Zero Code.
          </span>{' '}
          <br className="hidden sm:inline" />
          True Inversion of Control.
        </h1>
      </div>

      {/* Subtitle / Value Proposition */}
      <p className="text-base sm:text-xl text-slate-300/90 max-w-3xl mx-auto font-normal leading-relaxed mb-10">
        The <span className="text-white font-semibold">Zapier of Web3</span>. Autonomous{' '}
        <span className="text-violet-300 font-semibold">Reactive Smart Contracts (RSC)</span> on Lasna listen to Base Sepolia
        events and trigger non-custodial <span className="text-cyan-300 font-semibold">ActionVault</span> callbacks with{' '}
        <span className="text-emerald-400 font-semibold">zero off-chain keepers</span>.
      </p>

      {/* 4. Action Buttons Flanked by Button Frames */}
      <div className="flex flex-col items-center mb-14 relative">
        <div className="flex flex-wrap items-center justify-center gap-4 relative z-10">
          <Link
            href="/workspace/studio"
            className="button-primary inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full text-sm font-semibold tracking-wide text-white transition-all shadow-lg active:scale-95"
          >
            <span>Launch Pipeline Studio</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <a
            href="#how-it-works"
            className="button-dark inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-medium tracking-wide text-white/90 hover:text-white transition-all"
          >
            <Play className="w-4 h-4 text-violet-400 fill-violet-400" />
            <span>Interactive Demo</span>
          </a>

          <a
            href="#proof"
            className="button-dark inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-medium tracking-wide text-white/90 hover:text-white transition-all"
          >
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>On-Chain Proof</span>
          </a>
        </div>

        {/* Decorative Button Wings */}
        <div className="hidden lg:block pointer-events-none select-none">
          <img
            alt=""
            src="/assets/images/hero/button-frame-1.png"
            width="316"
            aria-hidden="true"
            className="absolute -left-64 top-2 opacity-50"
          />
          <img
            alt=""
            src="/assets/images/hero/button-frame-2.png"
            width="316"
            aria-hidden="true"
            className="absolute -right-64 top-2 opacity-50"
          />
        </div>
      </div>

      {/* 5. Headline Metric Cards (Canary Style 4-Block Strip with Hairline Dividers) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 border border-white/15 rounded-2xl overflow-hidden max-w-4xl mx-auto shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="bg-[#0e1017]/90 p-5 text-left">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">Keeper Model</div>
          <div className="text-2xl font-bold tracking-tight text-white font-mono tabular-nums flex items-center gap-2">
            0 Keepers
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-sans font-medium">
              Pure RSC
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">No Gelato or Chainlink bots</p>
        </div>

        <div className="bg-[#0e1017]/90 p-5 text-left">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">E2E Loop Latency</div>
          <div className="text-2xl font-bold tracking-tight text-white font-mono tabular-nums flex items-center gap-2">
            1.2s - 2.8s
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 font-sans font-medium">
              200ms Denim
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Cross-chain event to callback</p>
        </div>

        <div className="bg-[#0e1017]/90 p-5 text-left">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">Custody Risk</div>
          <div className="text-2xl font-bold tracking-tight text-white font-mono tabular-nums flex items-center gap-2">
            0% Risk
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-sans font-medium">
              Non-Custodial
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Panic Button & Safe Sweep</p>
        </div>

        <div className="bg-[#0e1017]/90 p-5 text-left">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">Architecture</div>
          <div className="text-2xl font-bold tracking-tight text-white font-mono tabular-nums flex items-center gap-2">
            10 Nodes
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-sans font-medium">
              Turing-Complete
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Triggers, Guards, Actions</p>
        </div>
      </div>
    </section>
  );
}
