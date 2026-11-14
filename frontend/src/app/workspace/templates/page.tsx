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
    accentClass: 'tech-corner-accent-cyan',
    tagColor: 'text-[#00E5FF] border-[#00E5FF]/30 bg-[#00E5FF]/10',
    tags: ['DEFI RISK', 'UNISWAP V2', 'BASE SEPOLIA'],
    nodesCount: 4,
  },
  {
    id: 'take-profit',
    title: 'Take-Profit Scalper',
    description: 'When ETH rises >= $2,500 USD, automatically liquidate 25% profit into stablecoins with 1% slippage protection.',
    icon: RefreshCw,
    accentClass: 'tech-corner-accent-amber',
    tagColor: 'text-[#F59E0B] border-[#F59E0B]/30 bg-[#F59E0B]/10',
    tags: ['PROFIT HARVEST', 'AMM SYNC', 'RATE-LIMITED'],
    nodesCount: 4,
  },
  {
    id: 'anti-drainer',
    title: 'Anti-Drainer Cold Vault SafeSweep',
    description: 'If unauthorized outgoing transfers exceed 1.0 ETH, instantly sweep 100% of Vault ETH and ERC-20 assets to cold storage.',
    icon: Flame,
    accentClass: 'tech-corner-accent-emerald',
    tagColor: 'text-[#00FF9D] border-[#00FF9D]/30 bg-[#00FF9D]/10',
    tags: ['ANTI-PHISHING', '1-TX EVACUATION', 'COLD VAULT'],
    nodesCount: 3,
  },
  {
    id: 'cron-rebalance',
    title: 'Daily Autonomous Rebalancer',
    description: 'Trigger periodic Cron tick every 24 hours via ReactVM system block intervals to check collateral and balance assets.',
    icon: ShieldAlert,
    accentClass: 'tech-corner-accent',
    tagColor: 'text-[#8B5CF6] border-[#8B5CF6]/30 bg-[#8B5CF6]/10',
    tags: ['CRON TICK', 'ZERO SERVER', 'REACTIVE CORE'],
    nodesCount: 3,
  },
  {
    id: 'payday-splitter',
    title: 'Payday Auto-Splitter (Income DCA)',
    description: 'Upon incoming salary transfer (> 1,000 USDC), autonomously split: DCA 20% into ETH, sweep 30% to Cold Savings, keep 50% liquid.',
    icon: Wallet,
    accentClass: 'tech-corner-accent-cyan',
    tagColor: 'text-[#00E5FF] border-[#00E5FF]/30 bg-[#00E5FF]/10',
    tags: ['SALARY SPLIT', 'MULTI-SIGNAL', 'NON-CUSTODIAL'],
    nodesCount: 5,
  },
  {
    id: 'cross-chain-hedge',
    title: 'Unichain-to-Base Cross-Chain Hedge',
    description: 'Monitor rapid DEX price velocity drops on Unichain Sepolia (> 5% in 10s) and execute defensive swap on Base Sepolia.',
    icon: Globe,
    accentClass: 'tech-corner-accent',
    tagColor: 'text-[#C084FC] border-[#8B5CF6]/30 bg-[#8B5CF6]/10',
    tags: ['CROSS-CHAIN', 'VELOCITY GUARD', 'UNICHAIN <-> BASE'],
    nodesCount: 4,
  },
];

export default function TemplateLibraryPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 font-mono select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#1C142E]">
        <div>
          <div className="flex items-center gap-2">
            <span className="status-pip status-pip-violet" />
            <h1 className="text-base font-extrabold uppercase tracking-wider text-white">
              TEMPLATE RECIPE STORE // 1-CLICK AUTOMATION
            </h1>
          </div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">
            VERIFIED CROSS-CHAIN RECIPES &bull; CLICK TO HYDRATE ONTO STUDIO CANVAS
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-1 rounded-none bg-[#110C1E] border border-[#2E1F4A] text-[#C084FC]">
            6 PRODUCTION RECIPES
          </span>
        </div>
      </div>

      {/* Grid of 6 Recipes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {RECIPES.map((recipe) => {
          const Icon = recipe.icon;
          return (
            <div
              key={recipe.id}
              className={`tech-corner-accent p-5 bg-[#0B0813] border border-[#1C142E] hover:border-[#2E1F4A] transition-all space-y-4 flex flex-col justify-between ${recipe.accentClass}`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-none border ${recipe.tagColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        {recipe.title}
                      </h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {recipe.tags.map((t) => (
                          <span
                            key={t}
                            className="text-[9px] font-mono px-1.5 py-0.2 rounded-none bg-[#06040A] text-zinc-400 border border-[#1C142E]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <span className="text-[9px] font-mono text-zinc-500 tabular-nums">
                    {recipe.nodesCount} NODES
                  </span>
                </div>

                <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                  {recipe.description}
                </p>
              </div>

              <div className="pt-2 border-t border-[#1C142E]">
                <Link
                  href="/workspace/studio"
                  className="w-full flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-none bg-[#110C1E] hover:bg-[#1A102E] text-zinc-200 hover:text-white border border-[#2E1F4A] hover:border-[#8B5CF6] transition-colors cursor-pointer group"
                >
                  <Zap className="w-3.5 h-3.5 text-[#C084FC] group-hover:scale-110 transition-transform" />
                  <span>HYDRATE ONTO STUDIO CANVAS</span>
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
