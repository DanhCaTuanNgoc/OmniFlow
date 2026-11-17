"use client";

import React from "react";

interface HeroStudioCanvasMockupProps {
  act: number;
}

export default function HeroStudioCanvasMockup({ act }: HeroStudioCanvasMockupProps) {
  return (
    <div className="w-full h-full bg-[#08090D] relative flex flex-col font-sans select-none overflow-hidden">
      {/* Studio Dot Grid Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255, 255, 255, 0.25) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Top Studio Toolbar */}
      <div className="relative z-10 flex items-center justify-between px-16 py-10 border-b border-white/8 bg-[#0D0F18]/80 backdrop-blur-md">
        <div className="flex items-center gap-8">
          <div className="flex gap-4">
            <div className="w-9 h-9 rounded-full bg-red-500/60" />
            <div className="w-9 h-9 rounded-full bg-yellow-500/60" />
            <div className="w-9 h-9 rounded-full bg-green-500/60" />
          </div>
          <div className="h-14 w-1 bg-white/10 mx-4" />
          <div className="flex items-center gap-6 text-12 font-600 text-white/90">
            <span className="w-6 h-6 rounded-full bg-violet-400 animate-pulse" />
            <span>StopLoss_SafeSweep.flow</span>
          </div>
          <span className="text-11 px-6 py-2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
            DAG_OK · 3 NODES
          </span>
        </div>

        <div className="flex items-center gap-12 text-11 font-mono text-white/50">
          <div className="flex items-center gap-4">
            <span className="w-5 h-5 rounded-full bg-blue-400" />
            <span>Base Sepolia: 200ms Denim</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="w-5 h-5 rounded-full bg-violet-400" />
            <span>Lasna: 1.0s CometBFT</span>
          </div>
        </div>
      </div>

      {/* Main Canvas Node Viewport */}
      <div className="flex-1 relative flex items-center justify-center p-16 overflow-hidden">
        {/* Animated Connecting SVG Curves with Photon Pulses */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="curveGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="curveGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.8" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Wire 1: Node 1 to Node 2 */}
          <path
            d="M 285 180 C 340 180, 360 180, 415 180"
            fill="none"
            stroke="url(#curveGrad1)"
            strokeWidth="2"
            strokeDasharray="4 4"
            className="animate-pulse"
          />

          {/* Wire 2: Node 2 to Node 3 */}
          <path
            d="M 595 180 C 650 180, 670 180, 725 180"
            fill="none"
            stroke="url(#curveGrad2)"
            strokeWidth="2"
            strokeDasharray="4 4"
            className="animate-pulse"
          />
        </svg>

        {/* 3 Visual Nodes */}
        <div className="grid grid-cols-3 gap-24 sm:gap-40 w-full max-w-[880px] relative z-10">
          {/* Node 1: Origin Trigger */}
          <div
            className={`rounded-16 p-14 transition-all duration-300 relative border ${
              act === 0
                ? "bg-[#14121F] border-amber-400/80 shadow-[0_0_30px_rgba(245,158,11,0.25)] scale-[1.02]"
                : "bg-[#0E1017]/90 border-white/10 opacity-75 hover:opacity-100"
            }`}
          >
            <div className="flex items-center justify-between pb-8 mb-8 border-b border-white/6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-6 bg-amber-500/20 text-amber-400 flex items-center justify-center text-11 font-bold">
                  ⚡
                </div>
                <span className="text-11 font-700 tracking-wider text-amber-400 uppercase">Trigger</span>
              </div>
              <span className="text-9 px-6 py-2 rounded-full bg-white/6 text-white/60 font-mono">Out: Right</span>
            </div>

            <div className="text-13 font-600 text-white mb-2">Uniswap V2 Pair: Swap</div>
            <div className="text-11 text-white/50 font-mono mb-10">Base Sepolia · 200ms Denim</div>

            <div className="space-y-4 font-mono text-10">
              <div className="flex justify-between px-8 py-4 rounded-6 bg-white/4">
                <span className="text-white/40">Pair:</span>
                <span className="text-white/80">WETH / USDC</span>
              </div>
              <div className="flex justify-between px-8 py-4 rounded-6 bg-white/4">
                <span className="text-white/40">Condition:</span>
                <span className="text-amber-300 font-bold">Price &lt; $2,800</span>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-white/6 flex items-center justify-between text-10">
              <span className="text-white/40">Status</span>
              <span className={`font-mono font-bold ${act === 0 ? "text-amber-400 animate-pulse" : "text-white/60"}`}>
                {act === 0 ? "● SWAP_DETECTED" : "LISTENING"}
              </span>
            </div>
          </div>

          {/* Node 2: Reactive Omni RSC */}
          <div
            className={`rounded-16 p-14 transition-all duration-300 relative border ${
              act === 1
                ? "bg-[#160E28] border-violet-400/90 shadow-[0_0_35px_rgba(139,92,246,0.35)] scale-[1.02]"
                : "bg-[#0E1017]/90 border-white/10 opacity-75 hover:opacity-100"
            }`}
          >
            <div className="flex items-center justify-between pb-8 mb-8 border-b border-white/6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-6 bg-violet-500/20 text-violet-300 flex items-center justify-center text-11 font-bold">
                  🧠
                </div>
                <span className="text-11 font-700 tracking-wider text-violet-300 uppercase">Reactive Core</span>
              </div>
              <span className="text-9 px-6 py-2 rounded-full bg-white/6 text-white/60 font-mono">In / Out</span>
            </div>

            <div className="text-13 font-600 text-white mb-2">StopLoss_Pipeline.sol</div>
            <div className="text-11 text-white/50 font-mono mb-10">Reactive Omni Lasna · 5318007</div>

            <div className="space-y-4 font-mono text-10">
              <div className="flex justify-between px-8 py-4 rounded-6 bg-white/4">
                <span className="text-white/40">Cooldown Guard:</span>
                <span className="text-emerald-400 font-bold">&gt;= 60s (Delta +142s)</span>
              </div>
              <div className="flex justify-between px-8 py-4 rounded-6 bg-white/4">
                <span className="text-white/40">Gas Reserve:</span>
                <span className="text-violet-300">12,450 lREACT</span>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-white/6 flex items-center justify-between text-10">
              <span className="text-white/40">State Machine</span>
              <span className={`font-mono font-bold ${act === 1 ? "text-violet-400 animate-pulse" : "text-white/60"}`}>
                {act === 1 ? "● STATE_COMPUTED" : "AUTONOMOUS"}
              </span>
            </div>
          </div>

          {/* Node 3: ActionVault Execution */}
          <div
            className={`rounded-16 p-14 transition-all duration-300 relative border ${
              act === 2
                ? "bg-[#0B1A14] border-emerald-400/80 shadow-[0_0_35px_rgba(16,185,129,0.3)] scale-[1.02]"
                : "bg-[#0E1017]/90 border-white/10 opacity-75 hover:opacity-100"
            }`}
          >
            <div className="flex items-center justify-between pb-8 mb-8 border-b border-white/6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-6 bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-11 font-bold">
                  🛡️
                </div>
                <span className="text-11 font-700 tracking-wider text-emerald-400 uppercase">Action Vault</span>
              </div>
              <span className="text-9 px-6 py-2 rounded-full bg-white/6 text-white/60 font-mono">In: Left</span>
            </div>

            <div className="text-13 font-600 text-white mb-2">executeSafeSweep()</div>
            <div className="text-11 text-white/50 font-mono mb-10">Base Sepolia Callback Proxy</div>

            <div className="space-y-4 font-mono text-10">
              <div className="flex justify-between px-8 py-4 rounded-6 bg-white/4">
                <span className="text-white/40">Proxy Auth:</span>
                <span className="text-emerald-400 font-bold">VERIFIED_PROXY</span>
              </div>
              <div className="flex justify-between px-8 py-4 rounded-6 bg-white/4">
                <span className="text-white/40">Panic Button:</span>
                <span className="text-white/80">ARMED (Non-Custodial)</span>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-white/6 flex items-center justify-between text-10">
              <span className="text-white/40">Execution</span>
              <span className={`font-mono font-bold ${act === 2 ? "text-emerald-400 animate-pulse" : "text-white/60"}`}>
                {act === 2 ? "● CALLBACK_DISPATCHED" : "READY"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Live Telemetry Terminal Strip */}
      <div className="relative z-10 px-16 py-8 border-t border-white/8 bg-[#090B12] font-mono text-11 flex items-center justify-between text-white/70">
        <div className="flex items-center gap-8 truncate max-w-[85%]">
          <span className="text-violet-400 font-bold">LIVE TELEMETRY:</span>
          {act === 0 && (
            <span className="text-amber-300 truncate">
              [00:00:00.200] [Origin] BaseSepolia log: Pair.Swap(WETH/USDC, amount1In=1.5 ETH) emitted at block #19482104
            </span>
          )}
          {act === 1 && (
            <span className="text-violet-300 truncate">
              [00:00:01.210] [Lasna] Reactive RSC react() invoked. Cooldown check: OK (+142s). Emitted Callback(BaseSepolia, ActionVault)
            </span>
          )}
          {act === 2 && (
            <span className="text-emerald-400 truncate">
              [00:00:01.415] [Destination] Callback Proxy auth verified. SafeSweep executed: 1.5 ETH swept to backup safe!
            </span>
          )}
        </div>
        <div className="text-9 px-6 py-2 rounded bg-white/8 text-white/50 shrink-0">
          ACT {act + 1}/3
        </div>
      </div>
    </div>
  );
}
