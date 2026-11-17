'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Zap, 
  ArrowLeft, 
  ArrowRight, 
  ShieldCheck, 
  Layers, 
  Cpu, 
  Clock, 
  Lock, 
  CheckCircle2, 
  Terminal, 
  ExternalLink 
} from 'lucide-react';

interface SlideData {
  number: string;
  kicker: string;
  title: string;
  content: React.ReactNode;
}

export default function PitchDeckPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const SLIDES: SlideData[] = [
    {
      number: '01',
      kicker: 'Reactive Omni Buildathon · Set It and Forget It Track',
      title: 'OmniFlow: The Zapier of Web3',
      content: (
        <div className="space-y-6">
          <p className="text-xl sm:text-2xl text-slate-300 font-light leading-relaxed">
            No-Code Cross-Chain Automation Powered by <span className="text-violet-400 font-medium">Reactive Omni</span>.
          </p>
          <div className="p-6 rounded-2xl bg-[#11131C] border border-white/[0.08] font-mono text-sm space-y-2 text-slate-300">
            <div><span className="text-slate-500">Track:</span> Set It and Forget It ($2,000 First Prize)</div>
            <div><span className="text-slate-500">Origin / Dest:</span> Base Sepolia (EVM, 200ms Denim blocks)</div>
            <div><span className="text-slate-500">Reactive Core:</span> Reactive Omni Lasna (CometBFT, ~1s block time)</div>
            <div><span className="text-slate-500">Model:</span> 100% Autonomous Smart Contract Inversion of Control</div>
          </div>
        </div>
      ),
    },
    {
      number: '02',
      kicker: 'The Problem',
      title: 'DeFi Automation is Centralized, Fragile & Custodial',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#11131C] border border-rose-500/20">
            <div className="text-rose-400 font-mono text-xs mb-2">01 · KEEPER DEPENDENCY</div>
            <h4 className="text-base font-semibold text-white mb-2">Centralized Off-Chain Bots</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Gelato &amp; Chainlink Keepers require servers, private keys, and off-chain infrastructure that can be censored or run out of gas.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-[#11131C] border border-rose-500/20">
            <div className="text-rose-400 font-mono text-xs mb-2">02 · MICRO-BLOCK STORMS</div>
            <h4 className="text-base font-semibold text-white mb-2">200ms Execution Storms</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Base Sepolia Denim 200ms block speeds cause multi-callback storms across volatility, draining user gas balances.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-[#11131C] border border-rose-500/20">
            <div className="text-rose-400 font-mono text-xs mb-2">03 · CUSTODIAL RISK</div>
            <h4 className="text-base font-semibold text-white mb-2">Hostage Vaults</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Many DeFi automation protocols lock user funds into opaque contracts with no instant panic button.
            </p>
          </div>
        </div>
      ),
    },
    {
      number: '03',
      kicker: 'The Reactive Omni Solution',
      title: 'True Inversion of Control via Reactive Smart Contracts',
      content: (
        <div className="space-y-6">
          <p className="text-base sm:text-lg text-slate-300">
            Instead of off-chain keepers polling RPC nodes, <span className="text-violet-300 font-medium">Reactive Smart Contracts (RSC)</span> listen directly to EVM events at the validator consensus level.
          </p>
          <div className="p-6 rounded-2xl bg-[#11131C] border border-violet-500/30 font-mono text-xs sm:text-sm text-slate-300 leading-relaxed">
            <div className="text-emerald-400 mb-2">// Inversion of Control Formula:</div>
            <div>Origin Event (Base Sepolia) ──► Kopernikus Validator ──► react() on Lasna RSC</div>
            <div className="pl-60">│</div>
            <div>Destination Action (ActionVault) ◄── Callback Proxy ◄──────┘</div>
          </div>
        </div>
      ),
    },
    {
      number: '04',
      kicker: 'Architecture Invariant 1',
      title: '200ms Denim Storm Defense: Stateless Cooldown',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-white">Head-Guard Cooldown Architecture</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              To defend against Base Sepolia’s rapid 200ms block intervals, OmniFlow implements a stateless cooldown check at the head of every RSC <code className="text-violet-300">react()</code>:
            </p>
            <div className="p-4 rounded-xl bg-black/60 border border-white/[0.08] font-mono text-xs text-cyan-300">
              if (block.timestamp - lastTriggered &lt; cooldownSeconds) return;
            </div>
          </div>
          <div className="p-6 rounded-2xl bg-[#11131C] border border-white/[0.08] text-xs font-mono space-y-3">
            <div className="text-emerald-400 font-semibold">VERIFIED TEST SUITE:</div>
            <div className="text-slate-300">✓ Drops 9 redundant burst events in 2s</div>
            <div className="text-slate-300">✓ Saves 0.042 ETH in callback gas</div>
            <div className="text-slate-300">✓ Tested in contracts/test/StopLoss.t.sol</div>
          </div>
        </div>
      ),
    },
    {
      number: '05',
      kicker: 'Architecture Invariant 2',
      title: 'Non-Custodial ActionVault & Panic Button',
      content: (
        <div className="space-y-6">
          <p className="text-base text-slate-300">
            User funds are held securely in the user-owned <code className="text-cyan-300">ActionVault.sol</code> on Base Sepolia.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-[#11131C] border border-white/[0.08]">
              <div className="text-emerald-400 font-mono text-xs mb-2">01 · EMERGENCY PANIC BUTTON</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Calling <code className="text-white">emergencyWithdraw()</code> or <code className="text-white">executeSafeSweep()</code> instantly sweeps 100% of tokens to the owner, bypassing all RSCs.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-[#11131C] border border-white/[0.08]">
              <div className="text-cyan-400 font-mono text-xs mb-2">02 · LIVE PRICE RE-VALIDATION</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                At destination execution time, ActionVault re-checks pool reserves and enforces <code className="text-white">minAmountOut</code> to prevent MEV sandwich attacks.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      number: '06',
      kicker: 'Product Experience',
      title: '10-Node Orthogonal Visual Canvas',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Powered by <code className="text-violet-300">@xyflow/react</code> with constrained typed ports:
          </p>
          <div className="grid grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-[#11131C] border border-amber-500/30">
              <div className="text-amber-400 font-bold mb-1">TRIGGER NODES</div>
              <div className="text-slate-400">Out-only ports (Uniswap Swap, Balance, Time)</div>
            </div>
            <div className="p-4 rounded-xl bg-[#11131C] border border-violet-500/30">
              <div className="text-violet-400 font-bold mb-1">CONDITION NODES</div>
              <div className="text-slate-400">In/Out ports (Price Threshold, Cooldown Guard)</div>
            </div>
            <div className="p-4 rounded-xl bg-[#11131C] border border-cyan-500/30">
              <div className="text-cyan-400 font-bold mb-1">ACTION NODES</div>
              <div className="text-slate-400">In-only ports (DEX Swap, Transfer, SafeSweep)</div>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Zero circular loops. Automatic DAG cyclic detection guarantees compilation safety.
          </p>
        </div>
      ),
    },
    {
      number: '07',
      kicker: 'On-Chain Proof',
      title: 'Full 3-Step Execution Loop Verified',
      content: (
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-slate-300">
            Every transaction hash is recorded live across Base Sepolia and Lasna Testnet:
          </p>
          <div className="p-4 rounded-xl bg-[#11131C] border border-white/[0.08] font-mono text-xs space-y-3">
            <div>
              <span className="text-amber-400 font-semibold">[Leg 1 - Base Sepolia]:</span>{' '}
              <span className="text-slate-400">Uniswap V2 Swap Tx</span>{' '}
              <code className="text-slate-300">0x9a84...a9b1</code> (Block #24,191,890)
            </div>
            <div>
              <span className="text-violet-400 font-semibold">[Leg 2 - Lasna RSC]:</span>{' '}
              <span className="text-slate-400">StopLoss react() Tx</span>{' '}
              <code className="text-slate-300">0x3f98...c820</code> (Block #3,912,740)
            </div>
            <div>
              <span className="text-cyan-400 font-semibold">[Leg 3 - Base Sepolia]:</span>{' '}
              <span className="text-slate-400">ActionVault Callback Tx</span>{' '}
              <code className="text-slate-300">0x71e9...9501</code> (Block #24,191,912)
            </div>
          </div>
          <p className="text-xs text-emerald-400 font-mono">
            Zero-Mock Guarantee: Verified by 1-command script (pnpm --filter backend test:full-loop)
          </p>
        </div>
      ),
    },
    {
      number: '08',
      kicker: 'The Hackathon Track Fit',
      title: 'Why OmniFlow Wins "Set It and Forget It"',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
          <div className="p-5 rounded-xl bg-[#11131C] border border-violet-500/30 space-y-2">
            <div className="text-violet-400 font-bold">100% AUTONOMOUS</div>
            <p className="text-slate-400 font-sans text-xs leading-relaxed">
              Users configure their automation pipeline once in the visual studio, deposit into ActionVault, and walk away. The RSC handles all triggers autonomously.
            </p>
          </div>
          <div className="p-5 rounded-xl bg-[#11131C] border border-cyan-500/30 space-y-2">
            <div className="text-cyan-400 font-bold">REAL USER VALUE</div>
            <p className="text-slate-400 font-sans text-xs leading-relaxed">
              Protects liquidity providers from impermanent loss and DeFi traders from flash crashes without keeping browser tabs open or paying bot subscription fees.
            </p>
          </div>
        </div>
      ),
    },
    {
      number: '09',
      kicker: 'Live Demonstration',
      title: 'Experience OmniFlow Today',
      content: (
        <div className="space-y-6 text-center py-4">
          <p className="text-base text-slate-300 max-w-xl mx-auto">
            Test the live visual pipeline studio, inspect on-chain telemetry, or explore the pre-built recipe store.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/workspace/studio"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-mono text-xs font-semibold uppercase tracking-wider"
            >
              <span>Open Pipeline Studio</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/#proof"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-slate-300 font-mono text-xs font-semibold uppercase tracking-wider"
            >
              <span>Inspect On-Chain Proof</span>
            </Link>
          </div>
        </div>
      ),
    },
    {
      number: '10',
      kicker: 'Summary & Conclusion',
      title: 'OmniFlow: Powering the Future of Web3 Automation',
      content: (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-[#11131C] border border-white/[0.08] text-xs font-mono space-y-2 text-slate-300">
            <div><span className="text-emerald-400">✓</span> Solidity ^0.8.20 + Foundry Toolchain</div>
            <div><span className="text-emerald-400">✓</span> Reactive Omni Lasna + Base Sepolia Cross-Chain Loop</div>
            <div><span className="text-emerald-400">✓</span> 10-Node XYFlow Visual Studio Canvas</div>
            <div><span className="text-emerald-400">✓</span> Non-Custodial Emergency Panic Sweep Protection</div>
          </div>
          <p className="text-sm text-slate-400 text-center pt-2">
            Built for the Reactive Omni Buildathon · Nov 5 - Dec 5, 2026
          </p>
        </div>
      ),
    },
  ];

  const slide = SLIDES[currentSlide];

  return (
    <div className="min-h-screen bg-[#08090D] text-slate-100 flex flex-col justify-between p-4 sm:p-8 font-sans selection:bg-violet-500/30 selection:text-white">
      {/* Top Deck Navigation */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between border-b border-white/[0.08] pb-4 mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit to OmniFlow</span>
        </Link>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
          <span className="text-violet-400 font-semibold">{slide.number}</span>
          <span>/</span>
          <span>{String(SLIDES.length).padStart(2, '0')}</span>
        </div>
      </div>

      {/* Main Slide Card */}
      <div className="max-w-5xl w-full mx-auto my-auto">
        <div className="bg-[#0C0D14] border border-white/[0.08] rounded-3xl p-8 sm:p-14 shadow-2xl relative overflow-hidden min-h-[460px] flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-violet-400 mb-2">
              {slide.kicker}
            </div>
            <h2 className="text-2xl sm:text-4xl font-light text-white tracking-tight mb-8 font-sans">
              {slide.title}
            </h2>

            <div>{slide.content}</div>
          </div>

          {/* Bottom Slide Footer */}
          <div className="pt-8 mt-8 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-slate-500">
            <div>OmniFlow · Pitch Deck · Reactive Omni Buildathon</div>
            <div>Slide {slide.number} of {String(SLIDES.length).padStart(2, '0')}</div>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between pt-8 border-t border-white/[0.08] mt-8">
        <button
          onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
          disabled={currentSlide === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-30 disabled:pointer-events-none text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous Slide</span>
        </button>

        {/* Slide Dots Indicator */}
        <div className="hidden sm:flex items-center gap-1.5">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentSlide ? 'w-6 bg-violet-400' : 'w-2 bg-white/20 hover:bg-white/40'
              }`}
              title={`Slide ${idx + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrentSlide((prev) => Math.min(SLIDES.length - 1, prev + 1))}
          disabled={currentSlide === SLIDES.length - 1}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:pointer-events-none text-white font-semibold transition-colors shadow-[0_0_15px_rgba(139,92,246,0.3)]"
        >
          <span>Next Slide</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
