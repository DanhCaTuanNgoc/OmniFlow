'use client';

import React from 'react';
import { Cpu, Layers, Zap, Clock, Lock, Sparkles } from 'lucide-react';

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
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 border border-white/15 text-white/90 text-xs font-mono mb-4 font-medium shadow-badge-dark backdrop-blur-md">
          <Cpu className="w-3.5 h-3.5 text-violet-400" />
          <span>Core Engineering Principles</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-semibold text-white tracking-[-0.03em] mb-4 font-sans">
          Engineered for Security, Speed &amp; Non-Custodial Safety
        </h2>
        <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
          Built strictly according to the Reactive Omni specifications. Zero compromises on decentralization.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {PILLARS.map((p, idx) => {
          const Icon = p.icon;
          return (
            <div
              key={idx}
              className="bg-[#0e1017]/90 border border-white/10 hover:border-violet-500/30 rounded-3xl p-8 transition-all shadow-xl backdrop-blur-xl group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center text-violet-300 group-hover:scale-105 transition-transform shadow-badge-dark">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono text-violet-300 px-3 py-1 rounded-full bg-white/5 border border-white/10 font-medium">
                    {p.tagline}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-3 tracking-tight font-sans">{p.title}</h3>
                <p className="text-sm text-slate-300/90 leading-relaxed mb-6">{p.description}</p>
              </div>

              <div className="pt-4 border-t border-white/10 text-xs font-mono text-slate-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                <span>{p.highlight}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
