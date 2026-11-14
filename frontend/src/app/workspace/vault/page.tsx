'use client';

import React, { useState } from 'react';
import { 
  Vault, 
  AlertOctagon, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Lock,
  ExternalLink,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { CONTRACT_ADDRESSES } from '@/lib/constants';
import { truncateAddress } from '@/lib/utils';

export default function VaultManagerPage() {
  const [depositAmount, setDepositAmount] = useState('0.1');
  const [withdrawAmount, setWithdrawAmount] = useState('0.1');

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 select-none">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 shadow-sm">
              <Vault className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Vault Manager
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Non-Custodial Asset Vault on Base Sepolia &bull; {truncateAddress(CONTRACT_ADDRESSES.DEFAULT_ACTION_VAULT, 8)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`https://sepolia.basescan.org/address/${CONTRACT_ADDRESSES.DEFAULT_ACTION_VAULT}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-full bg-[#0E1017] hover:bg-[#161922] text-slate-200 hover:text-white border border-white/[0.08] hover:border-white/[0.16] transition-all cursor-pointer shadow-sm"
          >
            <span>View on Basescan</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>
      </div>

      {/* 4 Telemetry Metric Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Metric 1: Total Value Locked */}
        <div className="p-5 rounded-2xl bg-[#0E1017]/90 backdrop-blur-xl border border-white/[0.08] hover:border-white/[0.14] transition-all shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-xs">
            <span className="text-slate-400 font-medium">Vault Collateral</span>
            <span className="text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-[10px]">
              Secure
            </span>
          </div>
          <div className="my-3">
            <div className="text-2xl font-bold text-white tracking-tight tabular-nums flex items-baseline gap-1.5 font-mono">
              <span>0.5000</span>
              <span className="text-xs text-slate-400 font-normal font-sans">ETH</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5 tabular-nums">~$1,250.00 USD</div>
          </div>
          <div className="pt-2 border-t border-white/[0.06] flex justify-between text-[11px] text-slate-400">
            <span>Asset: <strong className="text-white font-medium">Native ETH</strong></span>
            <span>Allocated: <strong className="text-emerald-400 font-medium">100%</strong></span>
          </div>
        </div>

        {/* Metric 2: Authorized RSCs */}
        <div className="p-5 rounded-2xl bg-[#0E1017]/90 backdrop-blur-xl border border-white/[0.08] hover:border-white/[0.14] transition-all shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-xs">
            <span className="text-slate-400 font-medium">Authorized RSCs</span>
            <span className="text-violet-300 font-semibold px-2 py-0.5 rounded-full border border-violet-500/20 bg-violet-500/10 text-[10px]">
              Synchronized
            </span>
          </div>
          <div className="my-3">
            <div className="text-2xl font-bold text-white tracking-tight tabular-nums flex items-baseline gap-1.5 font-mono">
              <span>1</span>
              <span className="text-xs text-slate-400 font-normal font-sans">Pipeline Connected</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Flash Crash Stop-Loss</div>
          </div>
          <div className="pt-2 border-t border-white/[0.06] flex justify-between text-[11px] text-slate-400">
            <span>Trust Model: <strong className="text-white font-medium">Non-Custodial</strong></span>
            <span>Revocable: <strong className="text-emerald-400 font-medium">Yes</strong></span>
          </div>
        </div>

        {/* Metric 3: Cooldown Guard Status */}
        <div className="p-5 rounded-2xl bg-[#0E1017]/90 backdrop-blur-xl border border-white/[0.08] hover:border-white/[0.14] transition-all shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-xs">
            <span className="text-slate-400 font-medium">Storm Rate-Limiter</span>
            <span className="text-cyan-400 font-semibold px-2 py-0.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-[10px]">
              Armed
            </span>
          </div>
          <div className="my-3">
            <div className="text-2xl font-bold text-white tracking-tight tabular-nums flex items-baseline gap-1.5 font-mono">
              <span>300</span>
              <span className="text-xs text-slate-400 font-normal font-sans">Seconds</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">5 min cooldown interval</div>
          </div>
          <div className="pt-2 border-t border-white/[0.06] flex justify-between text-[11px] text-slate-400">
            <span>Defense: <strong className="text-white font-medium">200ms Flurry Guard</strong></span>
            <span>Status: <strong className="text-emerald-400 font-medium">Ready</strong></span>
          </div>
        </div>

        {/* Metric 4: SafeSweep Evacuation Target */}
        <div className="p-5 rounded-2xl bg-[#0E1017]/90 backdrop-blur-xl border border-white/[0.08] hover:border-white/[0.14] transition-all shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-xs">
            <span className="text-slate-400 font-medium">SafeSweep Destination</span>
            <span className="text-amber-400 font-semibold px-2 py-0.5 rounded-full border border-amber-500/20 bg-amber-500/10 text-[10px]">
              Cold Vault
            </span>
          </div>
          <div className="my-3">
            <div className="text-base font-bold text-white tracking-tight mt-1 truncate font-mono">
              {truncateAddress('0x70997970C51812dc3A010C7d01b50e0d17dc79C8', 6)}
            </div>
            <div className="text-xs text-slate-400 mt-1.5">Anti-Drainer Backup Address</div>
          </div>
          <div className="pt-2 border-t border-white/[0.06] flex justify-between text-[11px] text-slate-400">
            <span>Protection: <strong className="text-emerald-400 font-medium">1-Tx Evacuation</strong></span>
            <span>Coverage: <strong className="text-white font-medium">100%</strong></span>
          </div>
        </div>
      </div>

      {/* Main Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Deposit / Withdraw Controls */}
        <div className="p-6 rounded-2xl bg-[#0E1017]/90 backdrop-blur-xl border border-white/[0.08] space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <h3 className="text-sm font-bold text-white tracking-tight">
              Vault Liquidity Management
            </h3>
            <span className="text-xs text-slate-400">Base Sepolia</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-slate-400 text-xs font-medium mb-1.5">
                Deposit ETH into ActionVault
              </label>
              <div className="flex gap-2.5">
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="flex-1 bg-[#07080D] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-violet-500 tabular-nums"
                />
                <button className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_15px_-3px_rgba(139,92,246,0.4)] transition-all cursor-pointer">
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>Deposit ETH</span>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.06]">
              <label className="block text-slate-400 text-xs font-medium mb-1.5">
                Withdraw ETH to Owner Wallet
              </label>
              <div className="flex gap-2.5">
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="flex-1 bg-[#07080D] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-violet-500 tabular-nums"
                />
                <button className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-white/[0.06] hover:bg-white/[0.10] text-slate-200 hover:text-white border border-white/[0.08] transition-all cursor-pointer">
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                  <span>Withdraw ETH</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Panic Button Card (FinTech Red Wine Emergency Vault) */}
        <div className="p-6 rounded-2xl bg-[#140D14]/90 backdrop-blur-xl border border-rose-500/20 flex flex-col justify-between space-y-4 shadow-xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-rose-500/20">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <AlertOctagon className="w-4 h-4 text-rose-400" />
                <span>Emergency Panic Button</span>
              </div>
              <span className="status-dot status-dot-rose" />
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Unconditionally withdraw 100% of Vault ETH directly back to your owner wallet in a single transaction. Completely bypasses all Reactive Smart Contracts, active automations, and cooldown timers.
            </p>

            <div className="p-3 rounded-xl bg-[#0A060A] border border-rose-500/20 text-xs text-rose-300 flex items-center justify-between">
              <span>Function: <strong className="font-mono text-white">emergencyWithdraw()</strong></span>
              <span className="text-emerald-400 font-medium">Non-Custodial Guarantee</span>
            </div>
          </div>

          <button className="w-full flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_20px_-3px_rgba(244,63,94,0.4)] transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]">
            <AlertOctagon className="w-4 h-4" />
            <span>Trigger Emergency Panic Withdraw (100% ETH)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
