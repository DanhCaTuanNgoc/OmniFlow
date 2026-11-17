'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Zap, Sparkles } from 'lucide-react';

export function SimplerCTA() {
  return (
    <section aria-labelledby="cta-banner-title" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 isolate overflow-hidden max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-5xl font-semibold tracking-[-0.03em] text-white font-sans mb-3">
          Want something simpler?
        </h2>
        <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
          Try OmniFlow directly in your browser. Nothing to install.
        </p>
      </div>

      <div className="mx-auto max-w-5xl">
        <div
          style={{
            outline: '1px solid rgba(255, 255, 255, 0.15)',
            outlineOffset: '-1px',
            backgroundImage:
              'linear-gradient(114.58deg, #D1E9FF -1.34%, rgba(255, 222, 253, 0.56) 24.05%, rgba(247, 247, 247, 1) 74.82%)',
          }}
          className="relative overflow-hidden rounded-3xl p-8 sm:p-12 md:p-16 text-slate-900 shadow-2xl"
        >
          {/* Badge */}
          <div className="mb-6 flex w-max items-center gap-2 rounded-full bg-black/8 px-4 py-1 text-xs font-mono font-medium text-slate-800">
            <Sparkles className="w-3.5 h-3.5 text-violet-700" />
            <span>Zero Setup Required</span>
          </div>

          {/* Title */}
          <div className="max-w-2xl mb-6">
            <h3 id="cta-banner-title" className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-950 font-sans leading-tight">
              Compose, deploy, and verify autonomous cross-chain pipelines with the{' '}
              <span className="inline-flex items-center gap-2 text-violet-700 underline decoration-violet-300 underline-offset-4">
                Pipeline Studio
              </span>
            </h3>
          </div>

          <p className="text-slate-700 text-sm sm:text-base max-w-2xl leading-relaxed mb-8">
            Connect your MetaMask to Base Sepolia, visually connect triggers and conditions, and launch autonomous Reactive Smart Contracts on Lasna. Non-custodial ActionVault execution guaranteed.
          </p>

          {/* 2-Column Benefit Grid */}
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mb-10 text-sm font-medium text-slate-800">
            <li className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-violet-600/15 text-violet-700 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5" />
              </span>
              <span>100% Non-Custodial ActionVault</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-violet-600/15 text-violet-700 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5" />
              </span>
              <span>Zero Off-Chain Keepers or Relayers</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-violet-600/15 text-violet-700 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5" />
              </span>
              <span>200ms Denim Block Cooldown Guard</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-violet-600/15 text-violet-700 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5" />
              </span>
              <span>Real Block Explorer Transaction Hashes</span>
            </li>
          </ul>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/workspace/studio"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full text-sm font-semibold tracking-wide text-white bg-slate-950 hover:bg-slate-900 shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Launch Studio in Browser</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/workspace/templates"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-medium tracking-wide text-slate-800 bg-white/80 hover:bg-white border border-slate-300/80 shadow-sm transition-all"
            >
              <span>Explore Recipes</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
