'use client';

import React from 'react';
import Link from 'next/link';
import { Library, ArrowRight, ShieldAlert, TrendingDown, RefreshCw, Flame } from 'lucide-react';

const RECIPES = [
  {
    id: 'stop-loss',
    title: 'Flash Crash Stop-Loss',
    description: 'Listen to DEX Uniswap pair, if ETH falls below $1,800, swap 50% to USDC via ActionVault.',
    icon: TrendingDown,
    color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
    tags: ['DeFi', 'Risk Management', 'Base Sepolia'],
  },
  {
    id: 'take-profit',
    title: 'Take-Profit Scalper',
    description: 'When ETH rises above $2,500, automatically liquidate 25% profit into stablecoins.',
    icon: RefreshCw,
    color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    tags: ['DeFi', 'Profit Taking', 'Uniswap V2'],
  },
  {
    id: 'anti-drainer',
    title: 'Anti-Drainer Cold Vault SafeSweep',
    description: 'If unauthorized outgoing transfers exceed 1 ETH, sweep 100% vault assets to a cold backup address.',
    icon: Flame,
    color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    tags: ['Security', 'Anti-Hack', 'SafeSweep'],
  },
  {
    id: 'cron-rebalance',
    title: 'Daily Portfolio Rebalancer',
    description: 'Trigger periodic Cron tick every 24 hours to re-check collateral and swap surplus.',
    icon: ShieldAlert,
    color: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    tags: ['Cron', 'Automation', 'Autonomous'],
  },
];

export default function TemplateLibraryPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Library className="w-5 h-5 text-cyan-400" />
          Template Library (Recipe Store)
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Production-tested cross-chain automation recipes. Hydrate onto Canvas in 1 click.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {RECIPES.map((recipe) => {
          const Icon = recipe.icon;
          return (
            <div
              key={recipe.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl border ${recipe.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{recipe.title}</h3>
                    <div className="flex gap-1.5 mt-1">
                      {recipe.tags.map((t) => (
                        <span key={t} className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {recipe.description}
                </p>
              </div>

              <Link
                href="/workspace/studio"
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-cyan-400 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                Use Recipe in Studio <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
