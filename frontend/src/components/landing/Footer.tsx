'use client';

import React from 'react';
import Link from 'next/link';
import { Zap, Github, ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#07080C] py-12 px-4 sm:px-6 lg:px-8 text-xs font-mono text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white fill-white" />
          </div>
          <div>
            <span className="font-semibold text-white tracking-tight">OmniFlow</span>
            <span className="text-slate-500 ml-2">v1.0 · Reactive Buildathon 2026</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <Link href="/workspace/studio" className="hover:text-white transition-colors">
            Studio
          </Link>
          <Link href="/workspace/templates" className="hover:text-white transition-colors">
            Recipes
          </Link>
          <Link href="/deck" className="hover:text-white transition-colors">
            Pitch Deck
          </Link>
          <a
            href="https://sepolia.basescan.org"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            <span>Basescan</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="https://lasna.reactscan.net"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            <span>Reactscan</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="text-slate-600 text-center md:text-right">
          MIT License · Non-Custodial Cross-Chain Automation
        </div>
      </div>
    </footer>
  );
}
