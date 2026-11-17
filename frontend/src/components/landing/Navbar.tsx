'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Zap, ArrowRight, Presentation, ExternalLink, Github } from 'lucide-react';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#08090D]/85 backdrop-blur-md border-b border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.6)]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.5)] group-hover:scale-105 transition-transform">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white font-sans">
              Omni<span className="text-violet-400">Flow</span>
            </span>
          </Link>

          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-violet-500/10 text-violet-300 border border-violet-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Reactive Omni
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-mono tracking-wider uppercase text-slate-400">
          <a href="#how-it-works" className="hover:text-white transition-colors">
            How It Works
          </a>
          <a href="#architecture" className="hover:text-white transition-colors">
            Architecture
          </a>
          <a href="#proof" className="hover:text-white transition-colors">
            On-Chain Proof
          </a>
          <Link href="/workspace/templates" className="hover:text-white transition-colors">
            Recipes
          </Link>
          <Link
            href="/deck"
            className="flex items-center gap-1.5 text-violet-300 hover:text-white transition-colors font-semibold"
          >
            <Presentation className="w-3.5 h-3.5 text-violet-400" />
            Pitch Deck
          </Link>
        </nav>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors"
            title="GitHub Repository"
          >
            <Github className="w-4 h-4" />
          </a>

          <Link
            href="/workspace/studio"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-semibold uppercase tracking-wider text-white bg-violet-600 hover:bg-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Launch Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
