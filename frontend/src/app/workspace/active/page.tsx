'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Cpu, 
  ExternalLink, 
  Zap, 
  Pause,
  Fuel,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { truncateAddress } from '@/lib/utils';

const DEMO_ACTIVE_PIPELINES = [
  {
    id: 'pipe-84532-001',
    name: 'Flash Crash Stop-Loss',
    rscAddress: '0x18F45a329dEbC4F32A8e653Bcf6a3b2A3C17489C',
    originPair: 'ETH / USDC (Uniswap V2)',
    condition: 'Price <= $1,800.00 USD',
    action: 'Swap 50% Vault ETH -> USDC',
    gasRemaining: 0.9998,
    gasTotal: 1.0,
    callbacksTriggered: 1,
    status: 'ACTIVE',
    deployedAt: '14 Nov 2026 19:15',
  },
];

export default function ActiveAutomationsPage() {
  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6 select-none font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/20 flex items-center justify-center text-white shadow-sm shrink-0">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight font-display">
                Active Automations
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-mono font-medium">
                1 RUNNING
              </span>
            </div>
            <p className="text-xs text-[#8e8e8e] mt-0.5">
              Autonomous Reactive Smart Contracts (RSC) Running on Lasna Testnet
            </p>
          </div>
        </div>

        <Link
          href="/workspace/studio"
          prefetch={true}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full bg-white hover:bg-white/90 text-black shadow-[0_2px_12px_rgba(255,255,255,0.25)] transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
        >
          <Zap className="w-3.5 h-3.5 fill-black" />
          <span>New Pipeline</span>
        </Link>
      </div>

      {/* 4 Telemetry Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#0b0c10]/80 backdrop-blur-xl border border-white/[0.08] hover:border-white/[0.18] transition-all">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-xs">
            <span className="text-[11px] text-[#8e8e8e] uppercase font-mono tracking-wider">Engines</span>
            <span className="text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-[10px]">
              ONLINE
            </span>
          </div>
          <div className="my-2.5">
            <div className="text-2xl font-bold text-white tracking-tight tabular-nums font-display">
              01 <span className="text-xs text-[#8e8e8e] font-sans font-normal">Active RSC</span>
            </div>
          </div>
          <div className="pt-2 border-t border-white/[0.06] text-[11px] text-[#8e8e8e]">
            Chain: <strong className="text-violet-300 font-medium">Lasna (#5318007)</strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0b0c10]/80 backdrop-blur-xl border border-white/[0.08] hover:border-white/[0.18] transition-all">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-xs">
            <span className="text-[11px] text-[#8e8e8e] uppercase font-mono tracking-wider">Sponsored Gas</span>
            <span className="text-violet-300 font-semibold px-2 py-0.5 rounded-full border border-violet-500/20 bg-violet-500/10 text-[10px]">
              99.98%
            </span>
          </div>
          <div className="my-2.5">
            <div className="text-2xl font-bold text-white tracking-tight tabular-nums font-display">
              0.9998 <span className="text-xs text-[#8e8e8e] font-sans font-normal">lREACT</span>
            </div>
          </div>
          <div className="pt-2 border-t border-white/[0.06] text-[11px] text-[#8e8e8e]">
            Lifespan: <strong className="text-emerald-400 font-medium">~4,990 Calls</strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0b0c10]/80 backdrop-blur-xl border border-white/[0.08] hover:border-white/[0.18] transition-all">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-xs">
            <span className="text-[11px] text-[#8e8e8e] uppercase font-mono tracking-wider">RVM Latency</span>
            <span className="text-cyan-400 font-semibold px-2 py-0.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-[10px]">
              SUB-SEC
            </span>
          </div>
          <div className="my-2.5">
            <div className="text-2xl font-bold text-white tracking-tight tabular-nums font-display">
              1,140 <span className="text-xs text-[#8e8e8e] font-sans font-normal">ms (P99)</span>
            </div>
          </div>
          <div className="pt-2 border-t border-white/[0.06] text-[11px] text-[#8e8e8e]">
            Path: <strong className="text-cyan-300 font-medium">Base &harr; Lasna</strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0b0c10]/80 backdrop-blur-xl border border-white/[0.08] hover:border-white/[0.18] transition-all">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-xs">
            <span className="text-[11px] text-[#8e8e8e] uppercase font-mono tracking-wider">Storm Guard</span>
            <span className="text-amber-400 font-semibold px-2 py-0.5 rounded-full border border-amber-500/20 bg-amber-500/10 text-[10px]">
              ACTIVE
            </span>
          </div>
          <div className="my-2.5">
            <div className="text-2xl font-bold text-white tracking-tight tabular-nums font-display">
              300 <span className="text-xs text-[#8e8e8e] font-sans font-normal">Seconds</span>
            </div>
          </div>
          <div className="pt-2 border-t border-white/[0.06] text-[11px] text-[#8e8e8e]">
            Guard: <strong className="text-emerald-400 font-medium">Stateless Cooldown</strong>
          </div>
        </div>
      </div>

      {/* Pipelines List */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8e8e8e] font-mono">
          Deployed Reactive Smart Contracts
        </h3>

        {DEMO_ACTIVE_PIPELINES.map((p) => (
          <div
            key={p.id}
            className="p-5 md:p-6 rounded-2xl bg-[#0b0c10]/90 backdrop-blur-xl border border-white/[0.08] hover:border-white/[0.18] transition-all space-y-5 shadow-2xl"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold text-base text-white tracking-tight">
                    {p.name}
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-[#c4c2c3] font-mono">
                    {p.id}
                  </span>
                </div>
                <div className="text-xs text-[#8e8e8e] mt-1 font-mono">
                  RSC: <span className="text-slate-200">{truncateAddress(p.rscAddress, 8)}</span> &bull; Deployed: {p.deployedAt}
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <a
                  href="https://lasna.reactscan.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-full bg-[#16171a] hover:bg-[#202126] text-white border border-white/20 transition-all cursor-pointer shadow-sm"
                >
                  <span>ReactScan</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>

                <button className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition-colors cursor-pointer">
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </button>
              </div>
            </div>

            {/* Pipeline Configuration Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#050608] border border-white/[0.06] space-y-1">
                <span className="text-[11px] text-[#8e8e8e] font-medium">Trigger Stream</span>
                <div className="text-white font-semibold font-mono text-[11px]">{p.originPair}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#050608] border border-white/[0.06] space-y-1">
                <span className="text-[11px] text-[#8e8e8e] font-medium">Condition Guard</span>
                <div className="text-amber-300 font-semibold font-mono text-[11px]">{p.condition}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#050608] border border-white/[0.06] space-y-1">
                <span className="text-[11px] text-[#8e8e8e] font-medium">Destination Action</span>
                <div className="text-emerald-300 font-semibold font-mono text-[11px]">{p.action}</div>
              </div>
            </div>

            {/* Gas Fuel Gauge Bar */}
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#8e8e8e] flex items-center gap-1.5 font-medium">
                  <Fuel className="w-3.5 h-3.5 text-violet-400" />
                  lREACT Gas Fuel Tank
                </span>
                <span className="font-semibold text-white tabular-nums font-mono text-[11px]">
                  {p.gasRemaining} / {p.gasTotal} lREACT
                </span>
              </div>
              <div className="w-full bg-[#050608] h-2 rounded-full border border-white/[0.08] overflow-hidden">
                <div
                  className="bg-gradient-to-r from-violet-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(p.gasRemaining / p.gasTotal) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
