'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Library, 
  ArrowRight, 
  ShieldAlert, 
  TrendingDown, 
  RefreshCw, 
  Flame, 
  Wallet,
  Globe,
  Zap
} from 'lucide-react';

const RECIPES = [
  {
    id: 'stop-loss',
    title: 'Flash Crash Stop-Loss',
    description: 'Listen to DEX Uniswap pair on Base Sepolia. If ETH drops <= $1,800 USD, swap 50% Vault ETH into USDC via ActionVault.',
    icon: TrendingDown,
    tagColor: 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10',
    tags: ['DeFi Risk', 'Uniswap V2', 'Base Sepolia'],
    nodesCount: 4,
  },
  {
    id: 'take-profit',
    title: 'Take-Profit Scalper',
    description: 'When ETH rises >= $2,500 USD, automatically liquidate 25% profit into stablecoins with 1% slippage protection.',
    icon: RefreshCw,
    tagColor: 'text-amber-300 border-amber-500/30 bg-amber-500/10',
    tags: ['Profit Taking', 'AMM Sync', 'Rate-Limited'],
    nodesCount: 4,
  },
  {
    id: 'anti-drainer',
    title: 'Anti-Drainer Cold Vault SafeSweep',
    description: 'If unauthorized outgoing transfers exceed 1.0 ETH, instantly sweep 100% of Vault ETH and ERC-20 assets to cold storage.',
    icon: Flame,
    tagColor: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
    tags: ['Anti-Phishing', '1-Tx Evacuation', 'Cold Vault'],
    nodesCount: 3,
  },
  {
    id: 'cron-rebalance',
    title: 'Daily Autonomous Rebalancer',
    description: 'Trigger periodic Cron tick every 24 hours via ReactVM system block intervals to check collateral and balance assets.',
    icon: ShieldAlert,
    tagColor: 'text-violet-300 border-violet-500/30 bg-violet-500/10',
    tags: ['Cron Tick', 'Zero Server', 'Reactive Core'],
    nodesCount: 3,
  },
  {
    id: 'payday-splitter',
    title: 'Payday Auto-Splitter (Income DCA)',
    description: 'Upon incoming salary transfer (> 1,000 USDC), autonomously split: DCA 20% into ETH, sweep 30% to Cold Savings, keep 50% liquid.',
    icon: Wallet,
    tagColor: 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10',
    tags: ['Salary Split', 'Multi-Signal', 'Non-Custodial'],
    nodesCount: 5,
  },
  {
    id: 'cross-chain-hedge',
    title: 'Unichain-to-Base Cross-Chain Hedge',
    description: 'Monitor rapid DEX price velocity drops on Unichain Sepolia (> 5% in 10s) and execute defensive swap on Base Sepolia.',
    icon: Globe,
    tagColor: 'text-purple-300 border-purple-500/30 bg-purple-500/10',
    tags: ['Cross-Chain', 'Velocity Guard', 'Unichain <-> Base'],
    nodesCount: 4,
  },
];

export default function TemplateLibraryPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 shadow-sm">
              <Library className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Template Recipe Store
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Production-Tested Cross-Chain Automations &bull; 1-Click Hydration onto Canvas
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 font-medium">
            6 Production Recipes
          </span>
        </div>
      </div>

      {/* Grid of 6 Recipes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {RECIPES.map((recipe) => {
          const Icon = recipe.icon;
          return (
            <div
              key={recipe.id}
              className="p-6 rounded-2xl bg-[#0E1017]/90 backdrop-blur-xl border border-white/[0.08] hover:border-white/[0.14] transition-all space-y-4 flex flex-col justify-between shadow-xl"
            >
              <div className="space-y-3.5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border ${recipe.tagColor} shadow-sm`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">
                        {recipe.title}
                      </h3>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {recipe.tags.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#07080D] text-slate-300 border border-white/[0.06]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-mono text-slate-400 tabular-nums font-medium">
                    {recipe.nodesCount} Nodes
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {recipe.description}
                </p>
              </div>

              <div className="pt-3 border-t border-white/[0.06]">
                <Link
                  href="/workspace/studio"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-violet-600/10 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/20 hover:border-violet-500 transition-all cursor-pointer group shadow-sm"
                >
                  <Zap className="w-3.5 h-3.5 text-violet-400 group-hover:scale-110 group-hover:text-white transition-all" />
                  <span>Hydrate onto Studio Canvas</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
