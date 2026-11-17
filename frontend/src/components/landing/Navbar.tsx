'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Zap, ArrowRight, Github } from 'lucide-react';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/85 backdrop-blur-md border-b border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.04)]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.35)] group-hover:scale-105 transition-transform">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900 font-sans">
              Omni<span className="text-violet-600">Flow</span>
            </span>
          </Link>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-violet-50 text-violet-700 border border-violet-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Reactive Omni
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-mono tracking-wider uppercase text-slate-600 font-medium">
          <a href="#how-it-works" className="hover:text-violet-600 transition-colors">
            How It Works
          </a>
          <a href="#architecture" className="hover:text-violet-600 transition-colors">
            Architecture
          </a>
          <a href="#proof" className="hover:text-violet-600 transition-colors">
            On-Chain Proof
          </a>
          <Link href="/workspace/templates" className="hover:text-violet-600 transition-colors">
            Recipes
          </Link>
        </nav>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition-colors"
            title="GitHub Repository"
          >
            <Github className="w-4 h-4" />
          </a>

          <Link
            href="/workspace/studio"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-semibold uppercase tracking-wider text-white bg-violet-600 hover:bg-violet-700 shadow-[0_2px_12px_rgba(124,58,237,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Launch Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
