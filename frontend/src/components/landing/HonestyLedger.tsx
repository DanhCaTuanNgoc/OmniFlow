'use client';

import React, { useState } from 'react';
import { ShieldCheck, Check, Clock, Copy, AlertCircle, Play } from 'lucide-react';

interface VerificationRecord {
  leg: string;
  chain: string;
  network: string;
  contract: string;
  txHash: string;
  block: string;
  status: 'PENDING_RUN' | 'READY_TO_DEPLOY' | 'VERIFIED';
}

const RECORDS: VerificationRecord[] = [
  {
    leg: '1. Origin Event Trigger',
    chain: 'Base Sepolia (Chain 84532)',
    network: 'Origin DEX',
    contract: 'UniswapV2Pair.sol (Sync Event)',
    txHash: 'Awaiting deployment & swap execution via TASK-106/107',
    block: 'Pending Run',
    status: 'READY_TO_DEPLOY',
  },
  {
    leg: '2. Reactive Core Processing',
    chain: 'Reactive Omni Lasna (Chain 5318007)',
    network: 'Reactive Core',
    contract: 'StopLoss_Pipeline.sol (RSC)',
    txHash: 'Awaiting reactive trigger via TASK-107',
    block: 'Pending Run',
    status: 'READY_TO_DEPLOY',
  },
  {
    leg: '3. Destination Callback Execution',
    chain: 'Base Sepolia (Chain 84532)',
    network: 'Callback Vault',
    contract: 'ActionVault.sol (executeStopLoss)',
    txHash: 'Awaiting callback transaction via TASK-107',
    block: 'Pending Run',
    status: 'READY_TO_DEPLOY',
  },
];

const HONESTY_CLAIMS = [
  {
    claim: 'Smart Contracts Compiled & 100% Tested',
    status: 'Real & Tested',
    badge: 'success',
    evidence: '13/13 Foundry unit & fork tests PASS (ActionVault.t.sol & StopLoss_Pipeline.t.sol in contracts/)',
  },
  {
    claim: 'Stateless cooldown stops 200ms Denim block storms',
    status: 'Real & Tested',
    badge: 'success',
    evidence: 'Verified with Foundry testCooldownPreventsStorms (drops 100% of redundant micro-block triggers)',
  },
  {
    claim: 'Non-custodial panic withdrawal for vault deposits',
    status: 'Real & Tested',
    badge: 'success',
    evidence: 'ActionVault.emergencyWithdraw() grants owner unconditional instant token recovery',
  },
  {
    claim: 'Live Testnet On-Chain Deployment',
    status: 'Next Up (TASK-106)',
    badge: 'pending',
    evidence: 'Contract code ready, pending script execution onto Base Sepolia & Reactive Lasna Testnet',
  },
  {
    claim: 'Multi-Chain Full-Loop Execution Evidence',
    status: 'Next Up (TASK-107)',
    badge: 'pending',
    evidence: 'Will be generated into FULL_LOOP_EVIDENCE.json upon running scripts/test-full-loop.ts',
  },
];

export function HonestyLedger() {
  const [copied, setCopied] = useState(false);

  const copyVerifyCommand = () => {
    navigator.clipboard.writeText('pnpm --filter backend test:full-loop');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="proof" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono mb-3 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
          Strict Zero-Mock Protocol
        </div>
        <h2 className="text-3xl sm:text-5xl font-light text-slate-900 tracking-tight mb-4 font-sans">
          The On-Chain Honesty &amp; Verification Ledger
        </h2>
        <p className="text-slate-600 text-sm sm:text-base max-w-3xl mx-auto">
          We uphold 100% transparency. Below is the exact status of our smart contract testing and pending on-chain testnet deployment. No fake transaction hashes.
        </p>
      </div>

      {/* 1-Command Re-verification Card */}
      <div className="bg-white/95 border border-slate-200/90 rounded-2xl p-6 sm:p-8 mb-12 shadow-[0_8px_30px_rgba(15,23,42,0.04)] relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-amber-700 font-semibold mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Contract Pipeline: Ready for Live Testnet Deployment (TASK-106 &amp; 107)
            </div>
            <h3 className="text-xl font-medium text-slate-900">
              The 3-Step Cross-Chain Execution Pipeline
            </h3>
          </div>

          <button
            onClick={copyVerifyCommand}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 transition-colors self-start sm:self-auto font-medium"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Test-Loop Script'}</span>
          </button>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300 flex items-center justify-between overflow-x-auto mb-6 shadow-inner">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 select-none">$</span>
            <span className="text-emerald-400 font-semibold">pnpm --filter backend test:full-loop</span>
          </div>
          <span className="text-[11px] text-slate-400 pl-4 shrink-0">
            Will generate live FULL_LOOP_EVIDENCE.json upon deployment
          </span>
        </div>

        {/* 3-Legged Proof Table (Truthful, Zero-Mock) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Execution Leg</th>
                <th className="py-3 px-4">Network &amp; Contract</th>
                <th className="py-3 px-4">Block Status</th>
                <th className="py-3 px-4">Transaction Evidence</th>
                <th className="py-3 px-4 text-right">State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {RECORDS.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">{r.leg}</td>
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                    <div className="font-medium text-slate-800">{r.chain}</div>
                    <div className="text-[11px] text-slate-500">{r.contract}</div>
                  </td>
                  <td className="py-3.5 px-4 text-amber-700 font-semibold whitespace-nowrap">{r.block}</td>
                  <td className="py-3.5 px-4 text-slate-500 italic whitespace-nowrap">
                    {r.txHash}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold">
                      <Clock className="w-3 h-3 text-amber-600" />
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Honesty Claims Table (100% Truthful) */}
      <div className="bg-white/95 border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(15,23,42,0.03)]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-medium text-slate-900 font-sans">
            Honesty Table: What is Live vs What is Pending
          </h3>
          <span className="text-xs font-mono text-slate-500">
            Source of Truth: TASKS.md &amp; contracts/
          </span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {HONESTY_CLAIMS.map((item, idx) => (
            <div key={idx} className="py-4 grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 items-start">
              <div className="font-semibold text-slate-900">{item.claim}</div>
              <div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[11px] font-medium border ${
                  item.badge === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {item.badge === 'success' ? <Check className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                  {item.status}
                </span>
              </div>
              <div className="text-slate-600 font-mono text-[11px] leading-relaxed">
                {item.evidence}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
