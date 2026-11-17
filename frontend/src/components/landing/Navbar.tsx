'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Zap, ArrowRight, Github, Menu, X } from 'lucide-react';
import { springKeyframes } from '@/lib/spring';

const SCROLL_THRESHOLD = 300;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const pillRef = useRef<HTMLDivElement | null>(null);

  // Nav highlight pill follower
  const handleHoverIn = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const item = e.currentTarget;
    const pill = pillRef.current;
    if (!item || !pill) return;

    const x = item.offsetLeft;
    pill.style.top = `${item.offsetTop}px`;
    pill.style.height = `${item.clientHeight}px`;
    pill.style.width = `${item.clientWidth}px`;

    const o = Number(getComputedStyle(pill).opacity);
    const fresh = !o || o < 0.5;

    pill.animate(
      {
        transform: fresh ? [`translate(${x}px, 8px)`, `translate(${x}px, 0px)`] : `translate(${x}px, 0px)`,
        width: `${item.clientWidth}px`,
        opacity: [fresh ? 0 : 1, 1],
      },
      { duration: 180, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'both' }
    );
  }, []);

  const handleHoverOut = useCallback(() => {
    const pill = pillRef.current;
    if (!pill) return;
    pill.animate(
      { opacity: 0 },
      { duration: 180, easing: 'ease-out', fill: 'both' }
    );
  }, []);

  // Scroll listener for floating pill morph
  useEffect(() => {
    const onScroll = () => {
      const isPast = window.scrollY > SCROLL_THRESHOLD;
      setScrolled(isPast);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      ref={rootRef}
      className={`header left-0 w-full top-0 md:top-6 z-[3000] transition-all duration-300 ${
        scrolled ? 'header-scrolled' : 'absolute'
      }`}
    >
      <header className="header-inner w-full max-w-[1128px] mx-auto py-4 px-6 md:px-8 rounded-full flex items-center justify-between transition-all duration-300">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.4)] group-hover:scale-105 transition-transform">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <span className={`font-semibold text-base tracking-tight transition-colors ${scrolled ? 'text-slate-900' : 'text-white'}`}>
              Omni<span className="text-violet-400 font-bold">Flow</span>
            </span>
          </Link>

          {!scrolled && (
            <span className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium text-white/80 bg-white/8 border border-white/10 shadow-badge-dark backdrop-blur-md select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Reactive Omni Lasna
            </span>
          )}
        </div>

        {/* Center Nav List with Spring Follower Pill */}
        <nav className="hidden md:flex relative items-center gap-1 text-sm font-medium tracking-tight">
          <div
            ref={pillRef}
            className="header-nav-item-background opacity-0 pointer-events-none bg-white/12 dark:bg-white/10 absolute top-0 left-0 rounded-full h-8"
          />

          <a
            href="#how-it-works"
            onMouseEnter={handleHoverIn}
            onMouseLeave={handleHoverOut}
            className={`px-4 py-1.5 rounded-full transition-colors ${scrolled ? 'text-slate-700 hover:text-violet-700' : 'text-white/75 hover:text-white'}`}
          >
            How It Works
          </a>

          <a
            href="#architecture"
            onMouseEnter={handleHoverIn}
            onMouseLeave={handleHoverOut}
            className={`px-4 py-1.5 rounded-full transition-colors ${scrolled ? 'text-slate-700 hover:text-violet-700' : 'text-white/75 hover:text-white'}`}
          >
            Architecture
          </a>

          <a
            href="#surfaces"
            onMouseEnter={handleHoverIn}
            onMouseLeave={handleHoverOut}
            className={`px-4 py-1.5 rounded-full transition-colors ${scrolled ? 'text-slate-700 hover:text-violet-700' : 'text-white/75 hover:text-white'}`}
          >
            Live Surfaces
          </a>

          <a
            href="#proof"
            onMouseEnter={handleHoverIn}
            onMouseLeave={handleHoverOut}
            className={`px-4 py-1.5 rounded-full transition-colors ${scrolled ? 'text-slate-700 hover:text-violet-700' : 'text-white/75 hover:text-white'}`}
          >
            Proof
          </a>

          <Link
            href="/workspace/templates"
            onMouseEnter={handleHoverIn}
            onMouseLeave={handleHoverOut}
            className={`px-4 py-1.5 rounded-full transition-colors ${scrolled ? 'text-slate-700 hover:text-violet-700' : 'text-white/75 hover:text-white'}`}
          >
            Recipes
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/Venkat5599/portalcanary"
            target="_blank"
            rel="noopener noreferrer"
            className={`hidden sm:inline-flex items-center justify-center p-2 rounded-full transition-all ${
              scrolled
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                : 'button-dark text-white/80 hover:text-white'
            }`}
            title="GitHub Repository"
          >
            <Github className="w-4 h-4" />
          </a>

          <div className="header-sign-up-wrapper">
            <Link
              href="/workspace/studio"
              className="button-primary inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold tracking-wide text-white transition-all shadow-md active:scale-95"
            >
              <span>Launch Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden p-2 rounded-full ${
              scrolled ? 'text-slate-900 bg-slate-100' : 'button-dark text-white'
            }`}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[72px] bg-[#0a0714]/95 backdrop-blur-2xl z-[2999] p-6 flex flex-col gap-4 border-t border-white/10 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col gap-2 text-lg font-medium text-white/90">
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-3 rounded-xl hover:bg-white/8 transition-colors"
            >
              How It Works
            </a>
            <a
              href="#architecture"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-3 rounded-xl hover:bg-white/8 transition-colors"
            >
              Architecture
            </a>
            <a
              href="#surfaces"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-3 rounded-xl hover:bg-white/8 transition-colors"
            >
              Live Surfaces
            </a>
            <a
              href="#proof"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-3 rounded-xl hover:bg-white/8 transition-colors"
            >
              On-Chain Proof
            </a>
            <Link
              href="/workspace/templates"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-3 rounded-xl hover:bg-white/8 transition-colors"
            >
              Recipe Library
            </Link>
          </div>

          <div className="mt-auto pt-6 border-t border-white/10 flex flex-col gap-3">
            <Link
              href="/workspace/studio"
              onClick={() => setMobileMenuOpen(false)}
              className="button-primary w-full py-3.5 rounded-full text-center text-sm font-semibold text-white"
            >
              Launch Pipeline Studio
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
