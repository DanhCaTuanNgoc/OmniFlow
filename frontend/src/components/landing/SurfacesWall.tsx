'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  GitBranch, 
  Zap, 
  ShieldCheck, 
  Activity, 
  ListOrdered, 
  Sparkles, 
  Terminal,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { animate } from 'motion';

interface SurfaceItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
  title: string;
  description: string;
  metrics: { label: string; value: string }[];
  route: string;
}

const SURFACES: SurfaceItem[] = [
  {
    key: 'studio',
    label: 'Pipeline Studio',
    icon: GitBranch,
    tag: 'No-Code Canvas',
    title: 'Visual DAG Pipeline Studio',
    description: 'Design autonomous multi-chain workflows with 10 orthogonal visual nodes. Constrained typed ports prevent cyclic graphs and validate inputs before compilation.',
    metrics: [
      { label: 'Node Catalog', value: '10 Orthogonal' },
      { label: 'Port Type Safety', value: 'DAG Enforced' },
      { label: 'Compilation Time', value: '< 1.8s' },
    ],
    route: '/workspace/studio',
  },
  {
    key: 'rsc',
    label: 'Reactive Engine',
    icon: Zap,
    tag: 'Reactive Omni Lasna',
    title: 'Autonomous RSC Zero-Keeper Engine',
    description: 'Smart contracts on Reactive Omni Lasna subscribe directly to Base Sepolia event logs. Zero off-chain relayer custody or keeper dependencies.',
    metrics: [
      { label: 'Chain ID', value: '5318007' },
      { label: 'Consensus', value: 'CometBFT' },
      { label: 'Keeper Overhead', value: '0 Bots' },
    ],
    route: '/workspace/active',
  },
  {
    key: 'vault',
    label: 'ActionVault',
    icon: ShieldCheck,
    tag: 'Non-Custodial Security',
    title: 'ActionVault & Panic Button Protection',
    description: 'All funds remain strictly in the user-owned ActionVault on Base Sepolia. The Panic Button and executeSafeSweep() guarantee unconditional instant withdrawals.',
    metrics: [
      { label: 'Custody Model', value: 'Non-Custodial' },
      { label: 'Emergency Access', value: 'Instant' },
      { label: 'Re-Validation', value: 'Live Slippage' },
    ],
    route: '/workspace/vault',
  },
  {
    key: 'active',
    label: 'Active Pipelines',
    icon: Activity,
    tag: 'Live Monitoring',
    title: 'Autonomous Pipeline Monitor',
    description: 'Track deployed Reactive Smart Contracts, live gas balances in lREACT, trigger history, and cooldown status across rapid 200ms Denim block bursts.',
    metrics: [
      { label: 'Telemetry Stream', value: 'Live WebSocket' },
      { label: 'Denim Protection', value: 'Cooldown Guard' },
      { label: 'Status Tracking', value: 'Real-Time' },
    ],
    route: '/workspace/active',
  },
  {
    key: 'logs',
    label: 'Activity Logs',
    icon: ListOrdered,
    tag: 'Cross-Chain Stream',
    title: 'Multi-Chain Activity & Event Logs',
    description: 'Complete transparency. Inspect the full lifecycle: Base Sepolia origin swap event, Lasna react() trigger, and destination callback execution with Basescan links.',
    metrics: [
      { label: 'Event Filtering', value: 'Multi-Chain' },
      { label: 'Block Explorer', value: '1-Click Direct' },
      { label: 'Payload Inspection', value: 'Raw Hex + Decoded' },
    ],
    route: '/workspace/logs',
  },
  {
    key: 'recipes',
    label: 'Recipe Store',
    icon: Sparkles,
    tag: 'Battle-Tested',
    title: 'DeFi Recipe Library',
    description: 'Deploy pre-audited cross-chain automation templates in one click: DEX Stop-Loss, Payday Auto-Splitter, Volatility Hedge, and Liquidity Rebalancer.',
    metrics: [
      { label: 'Templates', value: '6 Curated' },
      { label: 'Hydration', value: '1-Click Canvas' },
      { label: 'Security Patterns', value: 'Pre-Verified' },
    ],
    route: '/workspace/templates',
  },
  {
    key: 'proof',
    label: 'On-Chain Proof',
    icon: Terminal,
    tag: 'Zero-Mock Evidence',
    title: 'Verifiable On-Chain Execution Ledger',
    description: 'Zero mocks. Every transaction hash links directly to Base Sepolia and Reactive Lasna block explorers as required by Reactive Buildathon judging standards.',
    metrics: [
      { label: 'Hashes Provided', value: '3 / 3 Required' },
      { label: 'Verify Script', value: 'test-full-loop.ts' },
      { label: 'Judges Evidence', value: 'FULL_LOOP_EVIDENCE' },
    ],
    route: '#proof',
  },
];

const MIN_DOCK_SIZE = 52;
const MAX_DOCK_SIZE = 76;
const MOUSE_REACH = 160;

export function SurfacesWall() {
  const [activeIdx, setActiveIdx] = useState(0);
  const dockRef = useRef<HTMLDivElement | null>(null);
  const itemsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const current = SURFACES[activeIdx];
  const IconComp = current.icon;

  // macOS-style magnification effect under cursor
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const mouseX = e.clientX;
    itemsRef.current.forEach((el) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const itemCenterX = rect.left + rect.width / 2;
      const dist = Math.abs(mouseX - itemCenterX);

      if (dist < MOUSE_REACH) {
        const factor = 1 - dist / MOUSE_REACH;
        const targetSize = MIN_DOCK_SIZE + (MAX_DOCK_SIZE - MIN_DOCK_SIZE) * (factor * factor);
        animate(el, { width: targetSize, height: targetSize }, { duration: 0.1 });
      } else {
        animate(el, { width: MIN_DOCK_SIZE, height: MIN_DOCK_SIZE }, { duration: 0.15 });
      }
    });
  };

  const handleMouseLeave = () => {
    itemsRef.current.forEach((el) => {
      if (!el) return;
      animate(el, { width: MIN_DOCK_SIZE, height: MIN_DOCK_SIZE }, { duration: 0.2 });
    });
  };

  return (
    <section id="surfaces" className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
      {/* Section Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-medium text-white/80 bg-white/10 border border-white/12 shadow-badge-dark mb-4 backdrop-blur-md">
          <Activity className="w-3.5 h-3.5 text-cyan-300" />
          <span>Interactive Surface Wall</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-semibold tracking-[-0.03em] text-white font-sans">
          Every Surface, Built for Production
        </h2>
        <p className="text-slate-300/80 text-sm sm:text-base max-w-2xl mx-auto mt-3">
          Explore the modular control interfaces of OmniFlow. Click any dock item below to inspect.
        </p>
      </div>

      {/* Main Surface Card Display */}
      <div className="max-w-4xl mx-auto mb-12">
        <div className="rounded-3xl p-1 bg-gradient-to-b from-white/20 via-white/5 to-transparent border border-white/15 shadow-[0_24px_70px_rgba(0,0,0,0.5)] backdrop-blur-2xl overflow-hidden transition-all duration-300">
          <div className="bg-[#0b0d14]/95 rounded-[22px] p-8 sm:p-10">
            {/* Surface Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-300 shadow-badge-dark">
                  <IconComp className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-violet-400 font-semibold mb-1">
                    {current.tag}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {current.title}
                  </h3>
                </div>
              </div>

              <Link
                href={current.route}
                className="button-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold text-white transition-all shadow-md active:scale-95"
              >
                <span>Open {current.label}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Surface Description */}
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed my-6 max-w-3xl">
              {current.description}
            </p>

            {/* Metrics Row (Canary Style Hairline 3-Box Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/10 border border-white/15 rounded-xl overflow-hidden">
              {current.metrics.map((m, i) => (
                <div key={i} className="bg-[#121520]/90 p-4">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                    {m.label}
                  </div>
                  <div className="text-lg font-bold font-mono text-white tabular-nums">
                    {m.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. macOS Style Magnifying Dock */}
      <div className="max-w-max mx-auto relative z-20">
        <div
          ref={dockRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="flex items-end gap-2 sm:gap-3 p-3 bg-white/10 border border-white/15 rounded-2xl sm:rounded-3xl shadow-[0_16px_50px_rgba(0,0,0,0.4)] backdrop-blur-2xl"
        >
          {SURFACES.map((item, idx) => {
            const isActive = idx === activeIdx;
            const ItemIcon = item.icon;
            return (
              <div key={item.key} className="relative group">
                {/* Floating Tooltip */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none px-3 py-1 rounded-md bg-[#121520]/95 border border-white/15 text-xs text-white font-medium whitespace-nowrap shadow-xl backdrop-blur-md">
                  {item.label}
                </div>

                {/* Dock Button */}
                <button
                  ref={(el) => { itemsRef.current[idx] = el; }}
                  onClick={() => setActiveIdx(idx)}
                  style={{ width: MIN_DOCK_SIZE, height: MIN_DOCK_SIZE }}
                  className={`flex items-center justify-center rounded-xl sm:rounded-2xl transition-colors duration-150 ${
                    isActive
                      ? 'bg-violet-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.6)] border border-violet-400'
                      : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white border border-white/10'
                  }`}
                  aria-label={item.label}
                >
                  <ItemIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
