'use client';

import React from 'react';
import Link from 'next/link';
import { Zap, ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#06070a] py-14 px-4 sm:px-6 lg:px-8 text-xs font-mono text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.4)]">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <div>
            <span className="font-semibold text-white tracking-tight">OmniFlow</span>
            <span className="text-slate-500 ml-2">v1.0 · Reactive Omni Buildathon 2026</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 font-medium text-slate-300">
          <Link href="/workspace/studio" className="hover:text-violet-400 transition-colors">
            Studio
          </Link>
          <Link href="/workspace/templates" className="hover:text-violet-400 transition-colors">
            Recipes
          </Link>
          <a
            href="https://sepolia.basescan.org"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-violet-400 transition-colors flex items-center gap-1.5"
          >
            <span>Basescan</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>
          <a
            href="https://lasna.reactscan.net"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-violet-400 transition-colors flex items-center gap-1.5"
          >
            <span>Reactscan</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>
          <a
            href="https://github.com/Venkat5599/portalcanary"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-violet-400 transition-colors flex items-center gap-1.5"
          >
            <span>GitHub</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>
        </div>

        <div className="text-slate-500 text-center md:text-right">
          MIT License · Non-Custodial Cross-Chain Automation
        </div>
      </div>
    </footer>
  );
}
