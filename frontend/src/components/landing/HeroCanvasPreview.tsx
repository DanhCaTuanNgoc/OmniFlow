'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Network, 
  ArrowRight, 
  Zap, 
  CheckCircle2, 
  ExternalLink,
  Shield,
  Activity,
  Layers,
  Sparkles,
  Terminal
} from 'lucide-react';

interface Scenario {
  id: string;
  actTitle: string;
  actSubtitle: string;
  name: string;
  badge: string;
  description: string;
  trigger: {
    chain: string;
    label: string;
    detail: string;
    event: string;
  };
  condition: {
    chain: string;
    label: string;
    detail: string;
    logic: string;
  };
  action: {
    chain: string;
    label: string;
    detail: string;
    target: string;
  };
  samplePayload: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'stop-loss',
    actTitle: 'Diagnose & Ingest',
    actSubtitle: 'Base Sepolia 200ms Denim event stream',
    name: '1. Cross-Chain DEX Stop-Loss',
    badge: 'DeFi Risk Guard',
    description: 'Listen to Base Sepolia Uniswap V2 pool reserves. When ETH price drops below $2,800, Lasna RSC triggers ActionVault callback to swap ETH into USDC.',
    trigger: {
      chain: 'Base Sepolia (Chain 84532)',
      label: 'Uniswap V2 Pair Event',
      detail: 'Sync(uint112 reserve0, uint112 reserve1)',
      event: '0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1',
    },
    condition: {
      chain: 'Reactive Omni Lasna (Chain 5318007)',
      label: 'StopLoss_Pipeline.sol (RSC)',
      detail: 'Reserve Ratio < $2,800 & Cooldown >= 60s',
      logic: 'react(chain_id, address, topic_0, data) => emit Callback(84532, ActionVault, gasLimit, payload)',
    },
    action: {
      chain: 'Base Sepolia (Chain 84532)',
      label: 'ActionVault.sol (Callback)',
      detail: 'Execute Uniswap swapExactTokensForTokens',
      target: '0xB0483DE0F92828b6d8a7092323A021752D812674',
    },
    samplePayload: '0x38ed1739000000000000000000000000... (Swap 0.5 WETH for min 1,400 USDC with slippage protection)',
  },
  {
    id: 'denim-storm',
    actTitle: 'Diff & Automate',
    actSubtitle: 'Lasna Zero-Keeper RSC execution',
    name: '2. 200ms Denim Storm Guard',
    badge: 'Multi-Block Defense',
    description: 'Stateless cooldown guard suppresses rapid-fire duplicate callbacks during Base Sepolia 200ms Denim block bursts, saving lREACT gas and preventing double execution.',
    trigger: {
      chain: 'Base Sepolia (Chain 84532)',
      label: 'Rapid Transfer Bursts (3 blocks/sec)',
      detail: 'Transfer(from, to, amount) x 12 within 1 second',
      event: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
    },
    condition: {
      chain: 'Reactive Omni Lasna (Chain 5318007)',
      label: 'Stateless Cooldown Guard',
      detail: 'block.timestamp - lastTriggeredTimestamp >= 60',
      logic: 'if (block.timestamp - lastTriggeredTimestamp < cooldownSeconds) return; (Stateless Drop)',
    },
    action: {
      chain: 'Base Sepolia (Chain 84532)',
      label: 'Authorized Vault Callback',
      detail: '1 Clean Execution Only (11 Spurious Bursts Filtered)',
      target: '0xB0483DE0F92828b6d8a7092323A021752D812674',
    },
    samplePayload: '0xa9059cbb000000000000000000000000... (Single safe transfer without gas drain or callback storm)',
  },
  {
    id: 'panic-sweep',
    actTitle: 'Execute & Protect',
    actSubtitle: 'Non-custodial Panic Button & Safe Sweep',
    name: '3. Non-Custodial Emergency Sweep',
    badge: 'Security Invariant',
    description: 'Always gives the user 100% control. Owner can instantly trigger emergencyWithdraw() or executeSafeSweep() to a pre-configured cold wallet, bypassing all RSC logic.',
    trigger: {
      chain: 'Base Sepolia (Chain 84532)',
      label: 'User Wallet / Security Event',
      detail: 'Owner clicks Panic Button in OmniFlow Studio',
      event: 'Direct Transaction from 0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    },
    condition: {
      chain: 'ActionVault.sol On-Chain Check',
      label: 'onlyOwner Modifier Verification',
      detail: 'msg.sender == owner (Zero-Trust Guarantee)',
      logic: 'require(msg.sender == owner, "UNAUTHORIZED_SWEEP")',
    },
    action: {
      chain: 'Base Sepolia (Chain 84532)',
      label: 'Instant Cold Wallet Evacuation',
      detail: '100% tokens swept to backupSafeAddress',
      target: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
    },
    samplePayload: '0x3ccfd60b (emergencyWithdraw ETH) + 0x56a6552e (executeSafeSweep all registered ERC20s to backupSafeAddress)',
  },
];

export function HeroCanvasPreview() {
  const [activeAct, setActiveAct] = useState(0);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  // Auto-advance timeline acts every 7.5 seconds
  useEffect(() => {
    let startTime = Date.now();
    const duration = 7500;

    const interval = setInterval(() => {
      setActiveAct((prev) => (prev + 1) % SCENARIOS.length);
      startTime = Date.now();
    }, duration);

    const frame = () => {
      if (progressBarRef.current) {
        const elapsed = (Date.now() - startTime) % duration;
        const progressInAct = elapsed / duration;
        const totalProgress = ((activeAct + progressInAct) / SCENARIOS.length) * 100;
        progressBarRef.current.style.width = `${totalProgress}%`;
      }
      rafId = requestAnimationFrame(frame);
    };

    let rafId = requestAnimationFrame(frame);

    return () => {
      clearInterval(interval);
      cancelAnimationFrame(rafId);
    };
  }, [activeAct]);

  const current = SCENARIOS[activeAct];

  return (
    <section id="how-it-works" className="relative py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Title */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-medium text-white/80 bg-white/10 border border-white/12 shadow-badge-dark mb-4 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-violet-300" />
          <span>Interactive Execution Loop</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-semibold tracking-[-0.03em] text-white font-sans">
          How OmniFlow Works On-Chain
        </h2>
        <p className="text-slate-300/80 text-sm sm:text-base max-w-2xl mx-auto mt-3">
          Observe live event ingestion on Base Sepolia, zero-keeper RSC processing on Reactive Lasna, and callback execution.
        </p>
      </div>

      {/* 1. Canary Style 3-Act Tabs Bar */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center gap-2 p-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl shadow-lg">
          {SCENARIOS.map((sc, idx) => {
            const isActive = idx === activeAct;
            return (
              <button
                key={sc.id}
                onClick={() => setActiveAct(idx)}
                className={`flex-1 flex flex-col items-center justify-center py-3 px-4 rounded-full transition-all duration-300 ${
                  isActive
                    ? 'bg-white/15 shadow-badge-dark border border-white/20 text-white'
                    : 'text-white/60 hover:text-white/90 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {idx === 0 && <Activity className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'opacity-60'}`} />}
                  {idx === 1 && <Zap className={`w-4 h-4 ${isActive ? 'text-violet-400' : 'opacity-60'}`} />}
                  {idx === 2 && <Shield className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'opacity-60'}`} />}
                  <span className="text-xs sm:text-sm font-semibold tracking-tight">{sc.actTitle}</span>
                </div>
                <span className="text-[11px] text-slate-300 hidden sm:block truncate max-w-[200px]">
                  {sc.actSubtitle}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Hero Tabs Continuous Progress Bar */}
      <div className="hero-tabs-progress w-full h-1 relative bg-white/10 mb-8 max-w-3xl mx-auto rounded-full overflow-hidden">
        <div
          ref={progressBarRef}
          className="h-full bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400 transition-all duration-75"
          style={{ width: `${((activeAct) / SCENARIOS.length) * 100}%` }}
        />
      </div>

      {/* 3. Showcase Frame with Decorative App Corners */}
      <div className="relative max-w-5xl mx-auto">
        {/* App Frame Corners */}
        <div className="hidden sm:block pointer-events-none select-none">
          <img
            alt=""
            src="/assets/images/hero/app-frame-2.png"
            width="228"
            aria-hidden="true"
            className="absolute -left-28 -top-8 z-20 opacity-70"
          />
          <img
            alt=""
            src="/assets/images/hero/app-frame-1.png"
            width="228"
            aria-hidden="true"
            className="absolute -right-28 -top-8 z-20 opacity-70"
          />
        </div>

        {/* Main Canvas Box */}
        <div className="rounded-3xl p-1 bg-gradient-to-b from-white/15 via-white/5 to-transparent border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl overflow-hidden relative">
          <div className="bg-[#0b0d14]/95 rounded-[22px] p-6 sm:p-8">
            {/* Pipeline Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-lg font-semibold text-white tracking-tight">{current.name}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-violet-500/15 text-violet-300 border border-violet-500/30">
                  {current.badge}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/workspace/studio"
                  className="button-primary inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-white transition-all shadow-md active:scale-95"
                >
                  <span>Open in Studio</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Pipeline Diagram: 3 Nodes Connected with Photon Beams */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8 relative">
              {/* Trigger Node */}
              <div className="rounded-2xl p-5 bg-[#121520] border border-cyan-500/30 shadow-[0_4px_20px_rgba(0,229,255,0.08)] relative">
                <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold mb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  Origin Trigger
                </div>
                <div className="text-sm font-semibold text-white mb-2">{current.trigger.label}</div>
                <div className="text-xs text-slate-400 font-mono break-all bg-black/40 p-2.5 rounded-lg border border-white/5 mb-3">
                  {current.trigger.detail}
                </div>
                <div className="text-[11px] text-cyan-300/80 font-mono">
                  {current.trigger.chain}
                </div>
              </div>

              {/* Condition Node (Reactive Core) */}
              <div className="rounded-2xl p-5 bg-[#141224] border border-violet-500/40 shadow-[0_4px_25px_rgba(139,92,246,0.12)] relative">
                <div className="text-[10px] font-mono uppercase tracking-wider text-violet-300 font-semibold mb-1 flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-violet-400 fill-violet-400" />
                  Reactive Core
                </div>
                <div className="text-sm font-semibold text-white mb-2">{current.condition.label}</div>
                <div className="text-xs text-slate-300 font-mono break-all bg-black/40 p-2.5 rounded-lg border border-white/5 mb-3">
                  {current.condition.detail}
                </div>
                <div className="text-[11px] text-violet-300/80 font-mono">
                  {current.condition.chain}
                </div>
              </div>

              {/* Action Node */}
              <div className="rounded-2xl p-5 bg-[#101b17] border border-emerald-500/30 shadow-[0_4px_20px_rgba(16,185,129,0.08)] relative">
                <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Callback Action
                </div>
                <div className="text-sm font-semibold text-white mb-2">{current.action.label}</div>
                <div className="text-xs text-slate-400 font-mono break-all bg-black/40 p-2.5 rounded-lg border border-white/5 mb-3">
                  {current.action.detail}
                </div>
                <div className="text-[11px] text-emerald-300/80 font-mono truncate">
                  Target: {current.action.target.slice(0, 10)}...{current.action.target.slice(-8)}
                </div>
              </div>
            </div>

            {/* Live Payload Stream Inspection Strip */}
            <div className="mt-4 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2 text-slate-400">
                <Terminal className="w-4 h-4 text-violet-400" />
                <span>Verified Payload Hash:</span>
              </div>
              <div className="text-slate-300 bg-black/50 px-3 py-1.5 rounded-lg border border-white/10 max-w-full truncate">
                {current.samplePayload}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
