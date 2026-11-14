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
    <div className="p-6 max-w-6xl mx-auto space-y-6 font-mono select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#1C142E]">
        <div>
          <div className="flex items-center gap-2">
            <span className="status-pip status-pip-emerald" />
            <h1 className="text-base font-extrabold uppercase tracking-wider text-white">
              ACTIVE AUTOMATIONS // REACTIVE OMNI RUNTIME
            </h1>
          </div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">
            AUTONOMOUS REACTIVE SMART CONTRACTS (RSC) ON LASNA &bull; ZERO CRON SERVERS
          </p>
        </div>

        <Link
          href="/workspace/studio"
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider rounded-none border border-[#8B5CF6] bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-md shadow-[#8B5CF6]/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>NEW PIPELINE</span>
        </Link>
      </div>

      {/* 4 Telemetry Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
        <div className="tech-corner-accent p-4 bg-[#0B0813] border border-[#1C142E]">
          <div className="flex items-center justify-between pb-2 border-b border-[#1C142E] text-[10px]">
            <div className="flex items-center gap-2">
              <span className="status-pip status-pip-emerald" />
              <span className="text-zinc-400 font-bold tracking-widest uppercase">RUNNING RSCS</span>
            </div>
            <span className="text-emerald-400 font-bold px-1 py-0.2 border border-emerald-900/60 bg-emerald-950/30 text-[9px]">
              ONLINE
            </span>
          </div>
          <div className="my-3">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">DEPLOYED ENGINES</div>
            <div className="text-2xl font-extrabold text-white tracking-tight mt-0.5 tabular-nums">
              01 <span className="text-xs text-zinc-500 font-normal">ACTIVE</span>
            </div>
          </div>
          <div className="pt-2 border-t border-[#1C142E] text-[10px] text-zinc-500">
            NETWORK: <strong className="text-[#C084FC]">REACTIVE LASNA (5318007)</strong>
          </div>
        </div>

        <div className="tech-corner-accent p-4 bg-[#0B0813] border border-[#1C142E]">
          <div className="flex items-center justify-between pb-2 border-b border-[#1C142E] text-[10px]">
            <div className="flex items-center gap-2">
              <span className="status-pip status-pip-violet" />
              <span className="text-zinc-400 font-bold tracking-widest uppercase">SPONSORED GAS</span>
            </div>
            <span className="text-[#C084FC] font-bold px-1 py-0.2 border border-purple-900/60 bg-purple-950/30 text-[9px]">
              99.98% OK
            </span>
          </div>
          <div className="my-3">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">lREACT BALANCE</div>
            <div className="text-2xl font-extrabold text-white tracking-tight mt-0.5 tabular-nums">
              0.9998 <span className="text-xs text-zinc-500 font-normal">lREACT</span>
            </div>
          </div>
          <div className="pt-2 border-t border-[#1C142E] text-[10px] text-zinc-500">
            AUTONOMOUS: <strong className="text-emerald-400">~4,990 CALLBACKS LEFT</strong>
          </div>
        </div>

        <div className="tech-corner-accent p-4 bg-[#0B0813] border border-[#1C142E]">
          <div className="flex items-center justify-between pb-2 border-b border-[#1C142E] text-[10px]">
            <div className="flex items-center gap-2">
              <span className="status-pip status-pip-cyan" />
              <span className="text-zinc-400 font-bold tracking-widest uppercase">CALLBACK LATENCY</span>
            </div>
            <span className="text-cyan-400 font-bold px-1 py-0.2 border border-cyan-900/60 bg-cyan-950/30 text-[9px]">
              SUB-SECOND
            </span>
          </div>
          <div className="my-3">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">EVENT &rarr; CALLBACK</div>
            <div className="text-2xl font-extrabold text-white tracking-tight mt-0.5 tabular-nums">
              1,140 <span className="text-xs text-zinc-500 font-normal">ms</span>
            </div>
          </div>
          <div className="pt-2 border-t border-[#1C142E] text-[10px] text-zinc-500">
            CROSS-CHAIN: <strong className="text-cyan-400">BASE &harr; LASNA</strong>
          </div>
        </div>

        <div className="tech-corner-accent p-4 bg-[#0B0813] border border-[#1C142E]">
          <div className="flex items-center justify-between pb-2 border-b border-[#1C142E] text-[10px]">
            <div className="flex items-center gap-2">
              <span className="status-pip status-pip-amber" />
              <span className="text-zinc-400 font-bold tracking-widest uppercase">RATE-LIMIT FILTER</span>
            </div>
            <span className="text-amber-400 font-bold px-1 py-0.2 border border-amber-900/60 bg-amber-950/30 text-[9px]">
              PROTECTED
            </span>
          </div>
          <div className="my-3">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">COOLDOWN BLOCKS</div>
            <div className="text-2xl font-extrabold text-white tracking-tight mt-0.5 tabular-nums">
              300 <span className="text-xs text-zinc-500 font-normal">SEC</span>
            </div>
          </div>
          <div className="pt-2 border-t border-[#1C142E] text-[10px] text-zinc-500">
            DEFENSE: <strong className="text-emerald-400">ANTI-FLURRY ACTIVE</strong>
          </div>
        </div>
      </div>

      {/* Pipelines List */}
      <div className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          // DEPLOYED REACTIVE CONTRACTS (LIVE TELEMETRY)
        </div>

        {DEMO_ACTIVE_PIPELINES.map((p) => (
          <div
            key={p.id}
            className="tech-corner-accent p-5 bg-[#0B0813] border border-[#1C142E] hover:border-[#2E1F4A] transition-colors space-y-4"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#1C142E]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="status-pip status-pip-emerald" />
                  <span className="font-extrabold text-sm text-white uppercase tracking-wider">
                    {p.name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-none bg-[#110C1E] border border-[#2E1F4A] text-[#C084FC]">
                    {p.id}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-500 mt-1">
                  RSC: <span className="text-zinc-300 font-mono">{truncateAddress(p.rscAddress, 8)}</span> &bull; DEPLOYED: {p.deployedAt}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://lasna.reactscan.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider rounded-none bg-[#110C1E] hover:bg-[#1A102E] text-zinc-300 hover:text-white border border-[#2E1F4A] hover:border-[#8B5CF6] transition-colors cursor-pointer"
                >
                  <span>REACTSCAN</span>
                  <ExternalLink className="w-3 h-3 text-[#C084FC]" />
                </a>

                <button className="flex items-center gap-1 px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider rounded-none bg-[#16080E] hover:bg-rose-950/70 text-rose-300 hover:text-rose-100 border border-rose-800/60 hover:border-rose-600 transition-colors cursor-pointer">
                  <Pause className="w-3 h-3" />
                  <span>PAUSE</span>
                </button>
              </div>
            </div>

            {/* Pipeline Configuration Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 bg-[#06040A] border border-[#1C142E] space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">TRIGGER STREAM:</span>
                <div className="text-zinc-200 font-bold">{p.originPair}</div>
              </div>
              <div className="p-2.5 bg-[#06040A] border border-[#1C142E] space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">CONDITION GUARD:</span>
                <div className="text-amber-400 font-bold">{p.condition}</div>
              </div>
              <div className="p-2.5 bg-[#06040A] border border-[#1C142E] space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">DESTINATION ACTION:</span>
                <div className="text-emerald-400 font-bold">{p.action}</div>
              </div>
            </div>

            {/* Gas Fuel Gauge Bar */}
            <div className="space-y-1.5 pt-2 border-t border-[#1C142E]">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Fuel className="w-3 h-3 text-[#C084FC]" />
                  lREACT GAS TANK STATUS
                </span>
                <span className="font-bold text-white tabular-nums">
                  {p.gasRemaining} / {p.gasTotal} lREACT
                </span>
              </div>
              <div className="w-full bg-[#06040A] h-2 rounded-none border border-[#1C142E] overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#8B5CF6] to-[#00FF9D] h-full rounded-none"
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
