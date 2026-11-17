'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Network, 
  ArrowRight, 
  Zap, 
  CheckCircle2, 
  ExternalLink 
} from 'lucide-react';

interface WorkflowScenario {
  id: string;
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

const SCENARIOS: WorkflowScenario[] = [
  {
    id: 'stop-loss',
    name: '1. Cross-Chain DEX Stop-Loss',
    badge: 'Flagship Recipe',
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
      target: 'ActionVault.executeStopLoss(tokenIn, tokenOut, minAmountOut)',
    },
    samplePayload: `{
  "pipeline": "StopLoss_ETH_USDC",
  "originChain": 84532,
  "reactiveCore": 5318007,
  "triggerReserves": { "reserve0": "100000000000000000000", "reserve1": "278500000000" },
  "calculatedPrice": "2785.00 USD",
  "thresholdPrice": "2800.00 USD",
  "cooldownCheck": "PASSED (delta = 142s > 60s)",
  "callbackTx": "0x4b78...91a2",
  "status": "EXECUTED_CONFIRMED"
}`,
  },
  {
    id: 'cooldown-storm',
    name: '2. 200ms Denim Storm Defense',
    badge: 'Security Invariant',
    description: 'Base Sepolia produces blocks every 200ms. OmniFlow RSC implements stateless timestamp defense, preventing multi-callback execution storms.',
    trigger: {
      chain: 'Base Sepolia (Chain 84532)',
      label: 'Rapid Swaps (10 txs in 2s)',
      detail: 'High-frequency arbitrage or flash rebound',
      event: 'Burst events in rapid Denim micro-blocks',
    },
    condition: {
      chain: 'Reactive Omni Lasna (Chain 5318007)',
      label: 'Stateless Cooldown Guard',
      detail: 'block.timestamp - lastTriggeredTimestamp < cooldownSeconds',
      logic: 'if (cooldown active) return; // Drop redundant trigger instantly',
    },
    action: {
      chain: 'Base Sepolia (Chain 84532)',
      label: 'Vault Protection Active',
      detail: 'Zero unnecessary callback gas spent',
      target: 'Multi-callback drain completely prevented',
    },
    samplePayload: `{
  "defenseMode": "StatelessCooldownTimestamp",
  "microBlockDelta": "200ms",
  "cooldownConfig": "60 seconds",
  "redundantEventsReceived": 9,
  "actionsTriggered": 1,
  "gasSaved": "0.042 ETH",
  "invariantStatus": "PROTECTED_ZERO_STORM"
}`,
  },
  {
    id: 'panic-sweep',
    name: '3. Non-Custodial Panic Sweep',
    badge: 'Non-Custodial Guarantee',
    description: 'User retains 100% unconditional control of funds. The Panic Button instantly sweeps all vault tokens directly back to the cold wallet.',
    trigger: {
      chain: 'Base Sepolia (Chain 84532)',
      label: 'User Panic Call',
      detail: 'ActionVault.emergencyWithdraw(token)',
      event: 'EmergencyWithdrawal(address token, uint256 amount)',
    },
    condition: {
      chain: 'Base Sepolia (Chain 84532)',
      label: 'Non-Custodial Ownership Check',
      detail: 'msg.sender == owner() (Zero Relayer Trust)',
      logic: 'Bypasses all RSC pipelines & relayer delays',
    },
    action: {
      chain: 'Base Sepolia (Chain 84532)',
      label: 'Direct Safe Transfer',
      detail: 'SafeERC20.safeTransfer(owner, balance)',
      target: 'Cold Wallet receives 100% of deposited assets',
    },
    samplePayload: `{
  "vaultAddress": "0x71bE...2959",
  "owner": "0xa674...98fe",
  "action": "EMERGENCY_PANIC_SWEEP",
  "tokensSwept": [
    { "symbol": "WETH", "amount": "2.45 WETH" },
    { "symbol": "USDC", "amount": "6,850.00 USDC" }
  ],
  "timeToWithdraw": "1 block (< 1s)",
  "nonCustodialStatus": "VERIFIED_SAFE"
}`,
  },
];

export function HeroCanvasPreview() {
  const [activeScenario, setActiveScenario] = useState<WorkflowScenario>(SCENARIOS[0]);
  const [showPayload, setShowPayload] = useState(false);

  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-mono mb-3 font-medium">
          <Network className="w-3.5 h-3.5 text-violet-600" />
          Interactive Canvas Simulation
        </div>
        <h2 className="text-3xl sm:text-5xl font-light text-slate-900 tracking-tight mb-4 font-sans">
          How OmniFlow Executes Inversion of Control
        </h2>
        <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto">
          No polling bots. No centralized API keys. A 3-step reactive chain execution orchestrated by pure smart contracts.
        </p>
      </div>

      {/* Scenario Selector Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
        {SCENARIOS.map((sc) => {
          const isActive = activeScenario.id === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => setActiveScenario(sc)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-mono transition-all flex items-center gap-2 border ${
                isActive
                  ? 'bg-violet-50 text-violet-900 border-violet-300 shadow-sm font-semibold'
                  : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>{sc.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                isActive ? 'bg-violet-200/60 text-violet-800' : 'bg-slate-100 text-slate-500'
              }`}>
                {sc.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Interactive Stage Card (Light Theme Obsidian Polish) */}
      <div className="bg-white/95 border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur-md relative overflow-hidden">
        {/* Scenario description bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-100">
          <p className="text-sm text-slate-700 font-medium">
            {activeScenario.description}
          </p>

          <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
            <button
              onClick={() => setShowPayload(!showPayload)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border ${
                showPayload
                  ? 'bg-violet-50 text-violet-800 border-violet-300'
                  : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {showPayload ? 'Hide Event JSON' : 'Inspect Event JSON'}
            </button>

            <Link
              href="/workspace/studio"
              className="text-xs font-mono text-violet-600 hover:text-violet-700 flex items-center gap-1 font-semibold"
            >
              <span>Open in Studio</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 3-Node Connected Flow Preview */}
        {!showPayload ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative items-center py-4">
            {/* Step 1: Trigger Node */}
            <div className="bg-amber-50/40 border border-amber-200/90 rounded-xl p-5 hover:border-amber-300 transition-all shadow-sm group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 font-semibold">
                  TRIGGER (ORIGIN)
                </span>
                <span className="text-[11px] font-mono text-slate-500 font-medium">Step 01</span>
              </div>
              <div className="text-xs font-mono text-slate-500 mb-1">{activeScenario.trigger.chain}</div>
              <div className="text-sm font-semibold text-slate-900 mb-2">{activeScenario.trigger.label}</div>
              <div className="p-2.5 rounded-lg bg-white border border-amber-200/70 font-mono text-[11px] text-amber-900 break-words shadow-xs">
                {activeScenario.trigger.detail}
              </div>
            </div>

            {/* Step 2: Reactive Condition Node */}
            <div className="bg-violet-50/50 border border-violet-300 rounded-xl p-5 hover:border-violet-400 transition-all shadow-[0_4px_20px_rgba(124,58,237,0.08)] group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-100 text-violet-800 border border-violet-200 font-semibold flex items-center gap-1">
                  <Zap className="w-3 h-3 text-violet-600 fill-violet-600" />
                  REACTIVE CORE (RSC)
                </span>
                <span className="text-[11px] font-mono text-violet-700 font-medium">Step 02</span>
              </div>
              <div className="text-xs font-mono text-slate-500 mb-1">{activeScenario.condition.chain}</div>
              <div className="text-sm font-semibold text-slate-900 mb-2">{activeScenario.condition.label}</div>
              <div className="p-2.5 rounded-lg bg-white border border-violet-200/80 font-mono text-[11px] text-violet-950 break-words shadow-xs">
                {activeScenario.condition.detail}
              </div>
            </div>

            {/* Step 3: Destination Action Node */}
            <div className="bg-indigo-50/40 border border-indigo-200/90 rounded-xl p-5 hover:border-indigo-300 transition-all shadow-sm group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200 font-semibold">
                  ACTION (DESTINATION)
                </span>
                <span className="text-[11px] font-mono text-slate-500 font-medium">Step 03</span>
              </div>
              <div className="text-xs font-mono text-slate-500 mb-1">{activeScenario.action.chain}</div>
              <div className="text-sm font-semibold text-slate-900 mb-2">{activeScenario.action.label}</div>
              <div className="p-2.5 rounded-lg bg-white border border-indigo-200/70 font-mono text-[11px] text-indigo-950 break-words shadow-xs">
                {activeScenario.action.detail}
              </div>
            </div>
          </div>
        ) : (
          /* JSON Payload Inspection View */
          <div className="relative">
            <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed shadow-inner">
              {activeScenario.samplePayload}
            </pre>
          </div>
        )}

        {/* Bottom verification footnote */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 font-mono gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>DAG Cyclic Validation Enforced</span>
            <span className="text-slate-300">·</span>
            <span>Constrained Typed Ports (Out → In/Out → In)</span>
          </div>

          <div className="text-slate-600">
            Powered by <span className="text-violet-700 font-semibold">@reactive-network/reactive-lib</span>
          </div>
        </div>
      </div>
    </section>
  );
}
