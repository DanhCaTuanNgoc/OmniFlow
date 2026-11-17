'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Zap, BookOpen } from 'lucide-react';

export function CallToAction() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="bg-gradient-to-b from-violet-50/90 via-white to-purple-50/60 border border-violet-200/90 rounded-3xl p-8 sm:p-14 text-center relative overflow-hidden shadow-[0_12px_40px_rgba(124,58,237,0.08)]">
        {/* Glow behind */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[300px] bg-violet-400/[0.12] blur-[120px] pointer-events-none rounded-full" />

        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-violet-100/80 border border-violet-200 text-violet-800 text-xs font-mono mb-4 font-medium">
          <Zap className="w-3.5 h-3.5 text-violet-600 fill-violet-600" />
          Start Automating in 60 Seconds
        </div>

        <h2 className="text-3xl sm:text-5xl font-light text-slate-900 tracking-tight mb-4 font-sans max-w-2xl mx-auto">
          The Next Generation of Decentralized Automation
        </h2>

        <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
          No centralized keepers, no API keys, no monthly bot subscription. Compose your cross-chain triggers visually or deploy verified recipes.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/workspace/studio"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-mono font-semibold uppercase tracking-wider text-white bg-violet-600 hover:bg-violet-700 shadow-[0_4px_16px_rgba(124,58,237,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Launch Pipeline Studio</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/workspace/templates"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-mono font-semibold uppercase tracking-wider text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <BookOpen className="w-4 h-4 text-violet-600" />
            <span>Pre-built Recipes</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
