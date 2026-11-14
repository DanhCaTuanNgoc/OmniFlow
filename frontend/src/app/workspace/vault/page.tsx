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
  Flame
} from 'lucide-react';
import { CONTRACT_ADDRESSES } from '@/lib/constants';
import { truncateAddress } from '@/lib/utils';

export default function VaultManagerPage() {
  const [depositAmount, setDepositAmount] = useState('0.1');
  const [withdrawAmount, setWithdrawAmount] = useState('0.1');

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 font-mono select-none">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#1C142E]">
        <div>
          <div className="flex items-center gap-2">
            <span className="status-pip status-pip-emerald" />
            <h1 className="text-base font-extrabold uppercase tracking-wider text-white">
              VAULT MANAGER // NON-CUSTODIAL STORAGE
            </h1>
          </div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">
            BASE SEPOLIA &bull; ACTIONVAULT AT {truncateAddress(CONTRACT_ADDRESSES.DEFAULT_ACTION_VAULT, 8)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`https://sepolia.basescan.org/address/${CONTRACT_ADDRESSES.DEFAULT_ACTION_VAULT}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider rounded-none bg-[#110C1E] hover:bg-[#1A102E] text-zinc-300 hover:text-white border border-[#2E1F4A] hover:border-[#8B5CF6] transition-colors cursor-pointer"
          >
            <span>BASESCAN</span>
            <ExternalLink className="w-3 h-3 text-[#C084FC]" />
          </a>
        </div>
      </div>

      {/* 4 Telemetry Metric Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
        {/* Metric 1: Total Value Locked */}
        <div className="tech-corner-accent p-4 bg-[#0B0813] border border-[#1C142E] hover:border-[#2E1F4A] transition-colors">
          <div className="flex items-center justify-between pb-2 border-b border-[#1C142E] text-[10px]">
            <div className="flex items-center gap-2">
              <span className="status-pip status-pip-emerald" />
              <span className="text-zinc-400 font-bold tracking-widest uppercase">TOTAL BALANCE</span>
            </div>
            <span className="text-emerald-400 font-bold px-1 py-0.2 border border-emerald-900/60 bg-emerald-950/30 text-[9px]">
              SECURE
            </span>
          </div>
          <div className="my-3">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">COLLATERAL HELD</div>
            <div className="text-2xl font-extrabold text-white tracking-tight mt-0.5 tabular-nums flex items-baseline gap-1.5">
              <span>0.5000</span>
              <span className="text-xs text-zinc-500 font-normal">ETH</span>
            </div>
          </div>
          <div className="pt-2 border-t border-[#1C142E] flex justify-between text-[10px] text-zinc-500">
            <span>FIAT VALUE: <strong className="text-zinc-200 tabular-nums">~$1,250.00</strong></span>
            <span>RATIO: <strong className="text-[#C084FC]">100% ETH</strong></span>
          </div>
        </div>

        {/* Metric 2: Authorized RSCs */}
        <div className="tech-corner-accent p-4 bg-[#0B0813] border border-[#1C142E] hover:border-[#2E1F4A] transition-colors">
          <div className="flex items-center justify-between pb-2 border-b border-[#1C142E] text-[10px]">
            <div className="flex items-center gap-2">
              <span className="status-pip status-pip-violet" />
              <span className="text-zinc-400 font-bold tracking-widest uppercase">AUTHORIZED RSCS</span>
            </div>
            <span className="text-[#C084FC] font-bold px-1 py-0.2 border border-purple-900/60 bg-purple-950/30 text-[9px]">
              SYNCHRONIZED
            </span>
          </div>
          <div className="my-3">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">ACTIVE AGENTS</div>
            <div className="text-2xl font-extrabold text-white tracking-tight mt-0.5 tabular-nums flex items-baseline gap-1.5">
              <span>1</span>
              <span className="text-xs text-zinc-500 font-normal">PIPELINE</span>
            </div>
          </div>
          <div className="pt-2 border-t border-[#1C142E] flex justify-between text-[10px] text-zinc-500">
            <span>TRUST MODEL: <strong className="text-zinc-200">NON-CUSTODIAL</strong></span>
            <span>REVOCABLE: <strong className="text-emerald-400">YES</strong></span>
          </div>
        </div>

        {/* Metric 3: Cooldown Guard Status */}
        <div className="tech-corner-accent p-4 bg-[#0B0813] border border-[#1C142E] hover:border-[#2E1F4A] transition-colors">
          <div className="flex items-center justify-between pb-2 border-b border-[#1C142E] text-[10px]">
            <div className="flex items-center gap-2">
              <span className="status-pip status-pip-cyan" />
              <span className="text-zinc-400 font-bold tracking-widest uppercase">RATE-LIMIT DEFENSE</span>
            </div>
            <span className="text-cyan-400 font-bold px-1 py-0.2 border border-cyan-900/60 bg-cyan-950/30 text-[9px]">
              ARMED
            </span>
          </div>
          <div className="my-3">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">COOLDOWN WINDOW</div>
            <div className="text-2xl font-extrabold text-white tracking-tight mt-0.5 tabular-nums flex items-baseline gap-1.5">
              <span>300</span>
              <span className="text-xs text-zinc-500 font-normal">SEC</span>
            </div>
          </div>
          <div className="pt-2 border-t border-[#1C142E] flex justify-between text-[10px] text-zinc-500">
            <span>BLOCK DEFENSE: <strong className="text-zinc-200 tabular-nums">200ms</strong></span>
            <span>STATUS: <strong className="text-emerald-400">READY</strong></span>
          </div>
        </div>

        {/* Metric 4: SafeSweep Evacuation Target */}
        <div className="tech-corner-accent p-4 bg-[#0B0813] border border-[#1C142E] hover:border-[#2E1F4A] transition-colors">
          <div className="flex items-center justify-between pb-2 border-b border-[#1C142E] text-[10px]">
            <div className="flex items-center gap-2">
              <span className="status-pip status-pip-amber" />
              <span className="text-zinc-400 font-bold tracking-widest uppercase">SAFESWEEP TARGET</span>
            </div>
            <span className="text-amber-400 font-bold px-1 py-0.2 border border-amber-900/60 bg-amber-950/30 text-[9px]">
              COLD BACKUP
            </span>
          </div>
          <div className="my-3">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">BACKUP VAULT</div>
            <div className="text-base font-bold text-zinc-200 tracking-tight mt-1 truncate">
              {truncateAddress('0x70997970C51812dc3A010C7d01b50e0d17dc79C8', 6)}
            </div>
          </div>
          <div className="pt-2 border-t border-[#1C142E] flex justify-between text-[10px] text-zinc-500">
            <span>ANTI-DRAIN: <strong className="text-emerald-400">1-TX SWEEP</strong></span>
            <span>SCOPE: <strong className="text-zinc-200">100%</strong></span>
          </div>
        </div>
      </div>

      {/* Main Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Deposit / Withdraw Controls */}
        <div className="p-5 bg-[#0B0813] border border-[#1C142E] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#1C142E]">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              VAULT LIQUIDITY MANAGEMENT
            </span>
            <span className="text-[10px] text-zinc-500 uppercase">BASE SEPOLIA</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-zinc-400 text-[10px] uppercase tracking-wider mb-1">
                DEPOSIT ETH INTO VAULT
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="flex-1 bg-[#06040A] border border-[#1C142E] rounded-none px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#8B5CF6] tabular-nums"
                />
                <button className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-wider rounded-none border border-[#8B5CF6] bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-md shadow-[#8B5CF6]/20 transition-all cursor-pointer">
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>DEPOSIT</span>
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-[#1C142E]">
              <label className="block text-zinc-400 text-[10px] uppercase tracking-wider mb-1">
                WITHDRAW ETH TO WALLET
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="flex-1 bg-[#06040A] border border-[#1C142E] rounded-none px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#8B5CF6] tabular-nums"
                />
                <button className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-wider rounded-none bg-[#110C1E] hover:bg-[#1A102E] text-zinc-300 hover:text-white border border-[#2E1F4A] hover:border-[#8B5CF6] transition-colors cursor-pointer">
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#C084FC]" />
                  <span>WITHDRAW</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Panic Button Card (Tactical Red Alert) */}
        <div className="tech-corner-accent p-5 bg-[#16080E] border border-rose-800/60 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-rose-900/60">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                <AlertOctagon className="w-4 h-4 text-rose-500" />
                <span>EMERGENCY PANIC BUTTON (INSTANT WITHDRAW)</span>
              </div>
              <span className="status-pip status-pip-rose" />
            </div>

            <p className="text-[11px] text-zinc-300 font-sans leading-relaxed">
              Unconditionally withdraw 100% of Vault ETH back to your owner wallet in a single transaction. Completely bypasses all Reactive Smart Contracts, active automations, and cooldown timers.
            </p>

            <div className="p-2.5 bg-[#0B0813] border border-rose-900/40 text-[10px] text-rose-300 flex items-center justify-between">
              <span>FUNCTION: <strong className="font-mono text-white">emergencyWithdraw()</strong></span>
              <span className="text-emerald-400">NON-CUSTODIAL GUARANTEE</span>
            </div>
          </div>

          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider rounded-none bg-[#EF4444] hover:bg-rose-600 text-white shadow-lg shadow-rose-600/30 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]">
            <AlertOctagon className="w-4 h-4" />
            <span>TRIGGER PANIC WITHDRAW (100% ETH)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
