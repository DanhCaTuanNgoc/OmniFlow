'use client';

import React from 'react';
import { Vault, AlertOctagon, ShieldCheck } from 'lucide-react';
import { CONTRACT_ADDRESSES } from '@/lib/constants';
import { truncateAddress } from '@/lib/utils';

export default function VaultManagerPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Vault className="w-5 h-5 text-emerald-400" />
          Vault Manager (Non-Custodial)
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Deposit, withdraw assets and trigger the Emergency Panic Button directly on Base Sepolia.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Balance Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="text-xs text-slate-400">ActionVault Contract</div>
          <div className="font-mono text-xs text-cyan-400 font-bold">
            {truncateAddress(CONTRACT_ADDRESSES.DEFAULT_ACTION_VAULT, 8)}
          </div>
          <div className="pt-2">
            <div className="text-2xl font-extrabold text-slate-100 tabular-nums">0.50 ETH</div>
            <div className="text-xs text-slate-400">~$1,250.00 USD</div>
          </div>
        </div>

        {/* Panic Button Card */}
        <div className="p-5 rounded-2xl bg-red-950/20 border border-red-900/40 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase">
              <AlertOctagon className="w-4 h-4" />
              Panic Button (Instant Emergency Withdraw)
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Unconditionally withdraw 100% of Vault ETH back to your owner wallet in 1 transaction.
            </p>
          </div>

          <button className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-slate-100 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-600/30">
            <AlertOctagon className="w-4 h-4" />
            Emergency Withdraw All (Panic)
          </button>
        </div>
      </div>
    </div>
  );
}
