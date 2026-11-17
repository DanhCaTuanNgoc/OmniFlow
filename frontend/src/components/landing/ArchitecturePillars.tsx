'use client';

import React from 'react';
import { ShieldCheck, Cpu, Layers, Zap, Clock, Lock, Sparkles, AlertTriangle } from 'lucide-react';

const PILLARS = [
  {
    icon: Zap,
    title: 'Autonomous Inversion of Control',
    tagline: 'Zero Off-Chain Keepers',
    description:
      'Traditional Web3 automation relies on centralized bots (Gelato, Chainlink Automation, Defender) requiring off-chain servers and API keys. OmniFlow utilizes Reactive Smart Contracts (RSC) deployed directly on Reactive Omni Lasna that listen directly to EVM events and trigger autonomous callbacks.',
    highlight: 'Pure contract-to-contract reactivity with zero centralized infrastructure dependencies.',
  },
  {
    icon: Clock,
    title: 'Stateless Cooldown Guard',
    tagline: 'Built for 200ms Denim Blocks',
    description:
      'Base Sepolia upgraded to ultra-fast 200ms block intervals. Without defensive design, volatile markets cause callback storms that drain user gas. OmniFlow enforces a block timestamp cooldown guard at the very head of the react() method.',
    highlight: 'Stateless timestamp checking drops duplicate execution requests across micro-blocks effortlessly.',
  },
  {
    icon: Lock,
    title: 'Non-Custodial ActionVault Guarantee',
    tagline: 'Emergency Panic Sweep',
    description:
      'Your funds never leave your control. The ActionVault contract grants the wallet owner unconditional priority access to emergencyWithdraw() and executeSafeSweep() at all times, bypassing any pending automation or relayer delay.',
    highlight: 'Zero-trust architecture with live pool price re-validation to block MEV sandwiches.',
  },
  {
    icon: Layers,
    title: '10-Node Lean Orthogonal Studio',
    tagline: 'Constrained Typed Ports DAG',
    description:
      'Instead of confusing spaghetti nodes, OmniFlow enforces a clean DAG (Directed Acyclic Graph) topology. Ports are strictly typed: Trigger (out-only) → Condition (in/out) → Action (in-only). Circular loops are rejected on-the-fly.',
    highlight: 'Visual drag-and-drop studio with real-time JSON export and instant bytecode deployment.',
  },
];

export function ArchitecturePillars() {
  return (
    <section id="architecture" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-mono mb-3">
          <Cpu className="w-3.5 h-3.5 text-violet-400" />
          Core Engineering Principles
        </div>
        <h2 className="text-3xl sm:text-5xl font-light text-white tracking-tight mb-4 font-sans">
          Engineered for Security, Speed &amp; Non-Custodial Safety
        </h2>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
          Built strictly according to the Reactive Omni specifications. Zero compromises on decentralization.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {PILLARS.map((p, idx) => {
          const Icon = p.icon;
          return (
            <div
              key={idx}
              className="bg-[#0C0D14] border border-white/[0.08] hover:border-violet-500/40 rounded-2xl p-8 transition-all shadow-xl group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-10 h-10 rounded-xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center text-violet-300 group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono text-violet-300 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20">
                    {p.tagline}
                  </span>
                </div>

                <h3 className="text-xl font-medium text-white mb-3 tracking-tight">{p.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">{p.description}</p>
              </div>

              <div className="pt-4 border-t border-white/[0.06] text-xs font-mono text-slate-300 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>{p.highlight}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
