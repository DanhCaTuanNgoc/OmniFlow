'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Cpu, 
  ArrowRight, 
  Pause, 
  Play, 
  Fuel, 
  ExternalLink, 
  Zap, 
  Activity,
  CheckCircle2
} from 'lucide-react';
import { truncateAddress } from '@/lib/utils';
import { CONTRACT_ADDRESSES } from '@/lib/constants';

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

export function ActiveAutomationsPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#2E1E54]/60">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-purple-600/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Active Automations
              </h1>
              <p className="text-xs text-purple-300/70 mt-0.5">
                Autonomous Reactive Smart Contracts (RSC) Running on Lasna Testnet
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/workspace/studio"
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/25 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>New Pipeline</span>
        </Link>
      </div>

      {/* 4 Telemetry Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#110B1F]/90 border border-purple-900/30 hover:border-purple-500/40 transition-all shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-purple-900/20 text-xs">
            <span className="text-purple-300/70 font-medium">Running Engines</span>
            <span className="text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-900/40 bg-emerald-950/40 text-[10px]">
              Online
            </span>
          </div>
          <div className="my-3">
            <div className="text-2xl font-bold text-white tracking-tight tabular-nums">
              01 <span className="text-xs text-purple-300/70 font-normal">Active RSC</span>
            </div>
          </div>
          <div className="pt-2 border-t border-purple-900/20 text-[11px] text-purple-300/60">
            Chain: <strong className="text-violet-300 font-medium">Reactive Lasna (#5318007)</strong>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#110B1F]/90 border border-purple-900/30 hover:border-purple-500/40 transition-all shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-purple-900/20 text-xs">
            <span className="text-purple-300/70 font-medium">Sponsored Gas</span>
            <span className="text-purple-300 font-semibold px-2 py-0.5 rounded-full border border-purple-800/40 bg-purple-950/40 text-[10px]">
              99.98%
            </span>
          </div>
          <div className="my-3">
            <div className="text-2xl font-bold text-white tracking-tight tabular-nums">
              0.9998 <span className="text-xs text-purple-300/70 font-normal">lREACT</span>
            </div>
          </div>
          <div className="pt-2 border-t border-purple-900/20 text-[11px] text-purple-300/60">
            Lifespan: <strong className="text-emerald-400 font-medium">~4,990 Callbacks Left</strong>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#110B1F]/90 border border-purple-900/30 hover:border-purple-500/40 transition-all shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-purple-900/20 text-xs">
            <span className="text-purple-300/70 font-medium">Reaction Latency</span>
            <span className="text-cyan-400 font-semibold px-2 py-0.5 rounded-full border border-cyan-900/40 bg-cyan-950/40 text-[10px]">
              Sub-Second
            </span>
          </div>
          <div className="my-3">
            <div className="text-2xl font-bold text-white tracking-tight tabular-nums">
              1,140 <span className="text-xs text-purple-300/70 font-normal">ms (P99)</span>
            </div>
          </div>
          <div className="pt-2 border-t border-purple-900/20 text-[11px] text-purple-300/60">
            Path: <strong className="text-cyan-300 font-medium">Base Sepolia &harr; Lasna</strong>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#110B1F]/90 border border-purple-900/30 hover:border-purple-500/40 transition-all shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-purple-900/20 text-xs">
            <span className="text-purple-300/70 font-medium">Storm Defense</span>
            <span className="text-amber-400 font-semibold px-2 py-0.5 rounded-full border border-amber-900/40 bg-amber-950/40 text-[10px]">
              Protected
            </span>
          </div>
          <div className="my-3">
            <div className="text-2xl font-bold text-white tracking-tight tabular-nums">
              300 <span className="text-xs text-purple-300/70 font-normal">Seconds</span>
            </div>
          </div>
          <div className="pt-2 border-t border-purple-900/20 text-[11px] text-purple-300/60">
            Mechanism: <strong className="text-emerald-400 font-medium">Stateless Cooldown</strong>
          </div>
        </div>
      </div>

      {/* Pipelines List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white tracking-tight">
          Deployed Reactive Smart Contracts
        </h3>

        {DEMO_ACTIVE_PIPELINES.map((p) => (
          <div
            key={p.id}
            className="p-6 rounded-2xl bg-[#110B1F]/90 border border-purple-900/30 hover:border-purple-500/40 transition-all space-y-5 shadow-lg"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-purple-900/30">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="status-dot status-dot-emerald" />
                  <span className="font-bold text-base text-white">
                    {p.name}
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-950/60 border border-purple-800/40 text-purple-300 font-medium">
                    {p.id}
                  </span>
                </div>
                <div className="text-xs text-purple-300/60 mt-1 font-mono">
                  RSC Contract: <span className="text-slate-200">{truncateAddress(p.rscAddress, 8)}</span> &bull; Deployed: {p.deployedAt}
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <a
                  href="https://lasna.reactscan.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-full bg-[#150E28] hover:bg-[#1E1438] text-purple-200 hover:text-white border border-purple-800/40 transition-all cursor-pointer shadow-sm"
                >
                  <span>View ReactScan</span>
                  <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                </a>

                <button className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-full bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border border-rose-800/40 transition-colors cursor-pointer">
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </button>
              </div>
            </div>

            {/* Pipeline Configuration Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
              <div className="p-3.5 rounded-xl bg-[#0D0819] border border-purple-900/30 space-y-1">
                <span className="text-[11px] text-purple-300/60 font-medium">Trigger Stream:</span>
                <div className="text-white font-semibold">{p.originPair}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0D0819] border border-purple-900/30 space-y-1">
                <span className="text-[11px] text-purple-300/60 font-medium">Condition Guard:</span>
                <div className="text-amber-300 font-semibold">{p.condition}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0D0819] border border-purple-900/30 space-y-1">
                <span className="text-[11px] text-purple-300/60 font-medium">Destination Action:</span>
                <div className="text-emerald-300 font-semibold">{p.action}</div>
              </div>
            </div>

            {/* Gas Fuel Gauge Bar */}
            <div className="space-y-2 pt-2 border-t border-purple-900/20">
              <div className="flex justify-between items-center text-xs">
                <span className="text-purple-300/70 flex items-center gap-1.5 font-medium">
                  <Fuel className="w-3.5 h-3.5 text-purple-400" />
                  lREACT Gas Fuel Tank
                </span>
                <span className="font-semibold text-white tabular-nums">
                  {p.gasRemaining} / {p.gasTotal} lREACT Remaining
                </span>
              </div>
              <div className="w-full bg-[#0D0819] h-2.5 rounded-full border border-purple-900/30 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-violet-600 via-purple-500 to-emerald-400 h-full rounded-full transition-all duration-300 shadow-sm"
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

export default ActiveAutomationsPage;
