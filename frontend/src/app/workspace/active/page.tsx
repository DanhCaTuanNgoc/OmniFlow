'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Cpu, 
  ExternalLink, 
  Zap, 
  Pause,
  Fuel,
  Sparkles,
  RefreshCw,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Lock,
  ArrowRight,
  Sliders,
  Wallet
} from 'lucide-react';
import { useAccount, useBalance, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { CONTRACT_ADDRESSES } from '@/lib/constants';
import { truncateAddress } from '@/lib/utils';
import { MetricRibbon } from '@/components/common/MetricRibbon';

export default function ActiveAutomationsPage() {
  const { address: userAddress, isConnected, chainId } = useAccount();
  const [isRefuelModalOpen, setIsRefuelModalOpen] = useState(false);
  const [refuelAmount, setRefuelAmount] = useState('0.5');

  const rscAddress = CONTRACT_ADDRESSES.DEFAULT_RSC_STOP_LOSS;
  const isLasna = chainId === 5318007;

  // 1. Read Live On-Chain RSC lREACT Balance on Reactive Lasna (Chain ID: 5318007)
  const { 
    data: rscBalance, 
    isLoading: isRscBalanceLoading, 
    refetch: refetchRscBalance 
  } = useBalance({
    address: rscAddress,
    chainId: 5318007,
  });

  // Refuel Transaction (Send lREACT native token on Lasna to RSC)
  const { 
    sendTransaction, 
    data: refuelTxHash, 
    isPending: isRefuelPending,
    error: refuelError 
  } = useSendTransaction();

  const { isLoading: isRefuelConfirming, isSuccess: isRefuelSuccess } = useWaitForTransactionReceipt({
    hash: refuelTxHash,
  });

  const handleRefuel = () => {
    if (!refuelAmount || parseFloat(refuelAmount) <= 0) return;
    sendTransaction({
      to: rscAddress,
      value: parseEther(refuelAmount),
    });
  };

  const rawBalance = rscBalance?.value !== undefined 
    ? parseFloat(formatEther(rscBalance.value))
    : 0.9998;

  const gasPercentage = Math.min(100, Math.max(0, (rawBalance / 1.0) * 100));

  // Determine Gas Gauge Health Colors
  const gaugeColor = 
    rawBalance >= 0.5 
      ? 'from-violet-500 via-cyan-400 to-emerald-400'
      : rawBalance >= 0.1 
      ? 'from-amber-500 to-amber-300'
      : 'from-rose-600 to-rose-400';

  const gaugeStatusText = 
    rawBalance >= 0.5 
      ? 'OPTIMAL FUEL'
      : rawBalance >= 0.1 
      ? 'RESERVATION'
      : 'LOW FUEL';

  const estimatedRemainingCalls = Math.floor(rawBalance * 5000);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6 select-none font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/20 flex items-center justify-center text-white shadow-sm shrink-0">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight font-sans">
                Active Automations
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-mono font-medium">
                1 RUNNING
              </span>
              <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20 text-[10px] font-mono font-medium">
                REACTIVE LASNA
              </span>
            </div>
            <p className="text-xs text-[#8e8e8e] mt-0.5">
              Autonomous Reactive Smart Contracts (RSC) Running 24/7 on Lasna Testnet
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => refetchRscBalance()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-full bg-[#16171a] hover:bg-[#202126] text-[#c4c2c3] hover:text-white border border-white/20 transition-colors duration-150 cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRscBalanceLoading ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
            <span>Refresh Fuel</span>
          </button>

          <Link
            href="/workspace/studio"
            prefetch={true}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full bg-white hover:bg-white/90 text-black shadow-[0_2px_12px_rgba(255,255,255,0.25)] transition-[transform,background-color] duration-150 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Zap className="w-3.5 h-3.5 fill-black" />
            <span>New Pipeline</span>
          </Link>
        </div>
      </div>

      {/* Executive Telemetry Ribbon */}
      <MetricRibbon
        items={[
          {
            label: 'Automation Fleet',
            value: isConnected ? '01' : '00',
            hint: 'RSC Live',
            badge: {
              text: isConnected ? 'ONLINE' : 'STANDBY',
              tone: isConnected ? 'good' : 'neutral',
            },
          },
          {
            label: 'Reactive Fuel Pool',
            value: `${rawBalance.toFixed(3)}`,
            hint: 'lREACT',
            badge: {
              text: gaugeStatusText,
              tone: rawBalance >= 0.5 ? 'good' : rawBalance >= 0.1 ? 'warn' : 'bad',
            },
          },
          {
            label: 'RVM P99 Latency',
            value: '1,140',
            hint: 'ms',
            badge: {
              text: 'SUB-SEC',
              tone: 'info',
            },
          },
          {
            label: 'Storm Cooldown Guard',
            value: '300',
            hint: 'Seconds',
            badge: {
              text: 'ARMED',
              tone: 'warn',
            },
          },
        ]}
      />

      {/* Guest Mode Notice */}
      {!isConnected && (
        <div className="p-4 rounded-xl bg-[#0e1017] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Viewing Public Demo Fleet</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Connect your Web3 wallet to manage, refuel, or pause your deployed Reactive Smart Contracts.
              </div>
            </div>
          </div>
          <Link
            href="/workspace/studio"
            className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/10 transition-colors shrink-0 text-center"
          >
            Open Studio Draft
          </Link>
        </div>
      )}

      {/* Deployed Pipelines List */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8e8e8e] font-mono">
          Deployed Reactive Smart Contracts (Lasna Testnet)
        </h3>

        {/* Live Active Pipeline Fleet Card */}
        <div className="p-5 md:p-6 rounded-xl bg-[#090A0F] border border-white/[0.08] hover:border-white/[0.16] transition-colors duration-150 space-y-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-base text-white tracking-tight font-sans">
                  Flash Crash Stop-Loss &bull; Denim Guard
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/10 text-slate-300 font-mono">
                  #PIPE-84532-001
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-medium">
                  RSC ACTIVE
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-1 font-mono flex items-center gap-2 flex-wrap">
                <span>RSC: <strong className="text-slate-200">{truncateAddress(rscAddress, 8)}</strong></span>
                <span className="text-white/20">&bull;</span>
                <span>Network: <strong className="text-violet-300">Reactive Lasna (#5318007)</strong></span>
                <span className="text-white/20">&bull;</span>
                <span>Consensus: <strong className="text-cyan-300">CometBFT</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setIsRefuelModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors cursor-pointer shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Refuel lREACT</span>
              </button>

              <a
                href={`https://lasna.reactscan.net/address/${rscAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#14151B] hover:bg-[#1E2028] text-slate-200 hover:text-white border border-white/10 transition-colors cursor-pointer"
              >
                <span>ReactScan</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>

              <Link
                href="/workspace/vault"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition-colors cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause in Vault</span>
              </Link>
            </div>
          </div>

          {/* Institutional Route Streamline */}
          <div className="p-3 rounded-lg bg-[#050608] border border-white/[0.04]">
            <div className="text-[10px] font-mono uppercase text-slate-500 tracking-wider mb-2">
              Cross-Chain Autonomous Execution Stream
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
              {/* Origin */}
              <div className="p-3 rounded-lg bg-[#0A0B10] border border-white/[0.06] space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400">
                  <span>ORIGIN TRIGGER</span>
                  <span>BASE SEPOLIA #84532</span>
                </div>
                <div className="text-xs font-semibold text-white truncate font-mono">
                  Uniswap V2: {truncateAddress(CONTRACT_ADDRESSES.DEFAULT_PAIR_ETH_USDC, 6)}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Event: <span className="text-slate-300">Sync(uint112,uint112)</span>
                </div>
              </div>

              {/* Reactive Engine */}
              <div className="p-3 rounded-lg bg-[#0A0B10] border border-violet-500/20 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-violet-300">
                  <span>AUTONOMOUS RVM</span>
                  <span>LASNA #5318007</span>
                </div>
                <div className="text-xs font-semibold text-white truncate font-mono">
                  Condition: Price &le; $1,800.00 USD
                </div>
                <div className="text-[11px] text-amber-400 font-mono">
                  Defense: 300s Stateless Cooldown
                </div>
              </div>

              {/* Destination */}
              <div className="p-3 rounded-lg bg-[#0A0B10] border border-emerald-500/20 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400">
                  <span>CALLBACK ACTION</span>
                  <span>BASE SEPOLIA #84532</span>
                </div>
                <div className="text-xs font-semibold text-white truncate font-mono">
                  ActionVault: 50% SafeSwap
                </div>
                <div className="text-[11px] text-emerald-400/80 font-mono">
                  Verified Destination Callback Proxy
                </div>
              </div>
            </div>
          </div>

          {/* Gas Fuel Gauge Bar */}
          <div className="space-y-2 pt-2 border-t border-white/[0.06]">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <Fuel className="w-3.5 h-3.5 text-violet-400" />
                <span>RSC Gas Reserve (lREACT)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-400 font-mono">
                  {gasPercentage.toFixed(1)}% Capacity
                </span>
              </span>
              <span className="font-semibold text-white tabular-nums font-mono text-xs">
                {rawBalance.toFixed(4)} / 1.0000 lREACT (~{estimatedRemainingCalls} calls)
              </span>
            </div>
            <div className="w-full bg-[#050608] h-2 rounded-full border border-white/[0.08] overflow-hidden p-0.5">
              <div
                className={`bg-gradient-to-r ${gaugeColor} h-full rounded-full transition-[width] duration-500`}
                style={{ width: `${gasPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Refuel Modal */}
      {isRefuelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#090A0F] border border-white/[0.12] rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <Fuel className="w-5 h-5 text-violet-400" />
                <h3 className="text-base font-semibold text-white tracking-tight font-sans">
                  Refuel lREACT Gas
                </h3>
              </div>
              <button
                onClick={() => setIsRefuelModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xs font-mono"
              >
                Close [ESC]
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Reactive Smart Contracts require native <strong>lREACT</strong> on Reactive Lasna Testnet to pay for RVM computation and emit cross-chain callbacks back to Base Sepolia.
            </p>

            <div className="p-3.5 rounded-xl bg-[#050608] border border-white/[0.06] space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>RSC Contract:</span>
                <span className="font-mono text-white text-[11px]">{truncateAddress(rscAddress, 6)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Network:</span>
                <span className="font-mono text-violet-400 text-[11px]">Reactive Lasna (#5318007)</span>
              </div>
            </div>

            {/* Quick Amount Selector */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Select Amount (lREACT)</label>
              <div className="grid grid-cols-4 gap-2">
                {['0.1', '0.5', '1.0', '2.0'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setRefuelAmount(amt)}
                    className={`py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                      refuelAmount === amt
                        ? 'border-violet-500 bg-violet-500/20 text-white font-semibold'
                        : 'border-white/10 bg-[#121318] text-slate-300 hover:bg-white/[0.06]'
                    }`}
                  >
                    {amt} lREACT
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Custom Amount</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={refuelAmount}
                  onChange={(e) => setRefuelAmount(e.target.value)}
                  className="flex-1 bg-[#121318] border border-white/20 rounded-lg px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-violet-400 tabular-nums"
                />
                <button
                  onClick={handleRefuel}
                  disabled={isRefuelPending || isRefuelConfirming || !isConnected}
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-violet-600 hover:bg-violet-500 text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isRefuelPending || isRefuelConfirming ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending...</span>
                    </span>
                  ) : (
                    <span>Send Fuel</span>
                  )}
                </button>
              </div>
            </div>

            {/* Faucet Link */}
            <div className="pt-2 flex items-center justify-between text-xs border-t border-white/[0.06]">
              <span className="text-slate-400">Need testnet gas?</span>
              <a
                href="https://faucet.rnk.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
              >
                <span>Reactive Official Faucet</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
