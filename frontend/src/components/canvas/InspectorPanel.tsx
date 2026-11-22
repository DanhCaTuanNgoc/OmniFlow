'use client';

import React from 'react';
import { Node } from '@xyflow/react';
import { 
  X, 
  Sliders, 
  Trash2, 
  Info, 
  Radio, 
  Activity, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  ArrowLeftRight,
  Coins
} from 'lucide-react';
import { SUPPORTED_PAIRS } from '@/lib/constants';
import { isAddress, toEventSelector, type Address } from 'viem';
import { STOP_LOSS_TEMPLATE } from '@omniflow/shared';
import { VaultSetup } from './VaultSetup';
import { PipelineIssue } from '@/lib/pipelineLint';

interface InspectorPanelProps {
  selectedNode: Node | null;
  onUpdateNodeData: (id: string, data: Record<string, any>) => void;
  onDeleteNode: (id: string) => void;
  onClose: () => void;
  owner?: Address;
  originPool?: unknown;
  phaseTwo: boolean;
  supportsPriceVault: boolean;
  vaultLookup?: { vaults?: Address[]; error?: string };
  checkingVaults: boolean;
  crossChain: boolean;
  nodeIssues?: PipelineIssue[];
}

export function InspectorPanel({
  selectedNode,
  onUpdateNodeData,
  onDeleteNode,
  onClose,
  owner,
  originPool,
  phaseTwo,
  supportsPriceVault,
  vaultLookup,
  checkingVaults,
  crossChain,
  nodeIssues,
}: InspectorPanelProps) {
  if (!selectedNode) return null;

  const { id, type, data } = selectedNode;
  const ladder = data.executionPolicy === 'LADDER';
  const vaultPool = crossChain ? data.destinationPoolAddress : originPool;

  const handleChange = (field: string, value: any) => {
    onUpdateNodeData(id, {
      [field]: value,
    });
  };

  // Inline input validation states
  const hasErrors = nodeIssues && nodeIssues.length > 0;

  return (
    <div className="w-full bg-[var(--ws-rail)] flex flex-col h-full text-xs">
      {/* Header */}
      <div className="p-3.5 border-b border-[var(--ws-border)] bg-[var(--ws-rail)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid size-6 place-items-center rounded-md bg-[var(--ws-accent)]/10 text-[var(--ws-accent)]">
            <Sliders className="size-3.5" />
          </span>
          <span className="text-xs font-bold text-white tracking-tight">
            Node Inspector
          </span>
        </div>
        <button
          onClick={onClose}
          className="grid size-7 place-items-center rounded-md text-[var(--ws-muted)] hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          title="Close Inspector"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Body: Form Controls */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Node Info Header */}
        <div className="p-3.5 rounded-xl bg-[var(--ws-panel)] border border-[var(--ws-border)] space-y-1 shadow-sm">
          <div className="text-[10.5px] font-mono text-[var(--ws-muted)]">
            Node ID: {id} &bull; {type}
          </div>
          <div className="text-sm font-bold text-white">
            {String(data.label || type)}
          </div>
        </div>

        {/* Node Health / Issues Status Banner */}
        {hasErrors ? (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
              <AlertTriangle className="size-3.5 text-amber-400 shrink-0" />
              <span>Configuration Issues ({nodeIssues.length})</span>
            </div>
            <ul className="space-y-1 text-[11px] text-amber-200/90 pl-4 list-disc font-sans">
              {nodeIssues.map((issue) => (
                <li key={issue.id}>{issue.message}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-[11px] text-emerald-300">
            <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
            <span>Node parameters & ports are valid</span>
          </div>
        )}

        {/* 1. Watch DEX Price */}
        {type === 'watchDEXPrice' && (
          <div className="space-y-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Trading Pair</label>
              <select
                value={String(data.pairLabel || 'ETH / USDC')}
                onChange={(e) => {
                  const found = SUPPORTED_PAIRS.find((p) => p.label === e.target.value);
                  handleChange('pairLabel', e.target.value);
                  if (found) handleChange('pairAddress', found.address);
                }}
                className="w-full bg-[#07080D] border border-white/[0.08] rounded-xl p-2.5 text-white focus:outline-none focus:border-violet-500"
              >
                {SUPPORTED_PAIRS.map((p) => (
                  <option key={p.label} value={p.label}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Pair Contract Address</label>
              <input
                type="text"
                value={String(data.pairAddress || '')}
                onChange={(e) => handleChange('pairAddress', e.target.value)}
                placeholder="0xUniswapV2Pair..."
                className={`w-full bg-[#07080D] border rounded-xl p-2.5 font-mono text-[11px] focus:outline-none ${
                  !data.pairAddress && !data.pairLabel
                    ? 'border-rose-500/60 bg-rose-950/20 text-rose-200 focus:border-rose-500'
                    : 'border-white/[0.08] text-slate-200 focus:border-violet-500'
                }`}
              />
              {!data.pairAddress && !data.pairLabel && (
                <span className="flex items-center gap-1 text-[11px] text-rose-400 mt-1 font-mono">
                  <AlertCircle className="size-3 shrink-0" /> Pair contract address is required
                </span>
              )}
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Origin Chain</label>
              <select
                value={Number(data.originChainId ?? data.chainId ?? 84532)}
                onChange={(e) => {
                  const chainId = Number(e.target.value);
                  onUpdateNodeData(id, { chainId, originChainId: chainId });
                }}
                className="w-full bg-[#07080D] border border-white/[0.08] rounded-xl p-2.5 text-white font-mono text-xs focus:outline-none focus:border-violet-500"
              >
                <option value={84532}>Base Sepolia (84532)</option>
                <option value={1301}>Unichain Sepolia (1301 - Cross-Chain)</option>
              </select>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {Number(data.chainId || 84532) === 1301
                  ? '🌐 Cross-Chain Trigger: Listens to Unichain Sepolia'
                  : '⚡ Base Sepolia: 200ms Denim block execution'}
              </span>
            </div>
          </div>
        )}

        {/* 1b. Watch Transfers (Node #2) */}
        {type === 'watchTransfers' && (
          <div className="space-y-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Target Wallet</label>
              <input
                type="text"
                value={String(data.targetWallet || 'Connected Wallet')}
                onChange={(e) => handleChange('targetWallet', e.target.value)}
                placeholder="Connected Wallet or 0x..."
                className={`w-full bg-[#07080D] border rounded-xl p-2.5 font-mono text-[11px] focus:outline-none ${
                  Boolean(data.targetWallet && data.targetWallet !== 'Connected Wallet' && !isAddress(String(data.targetWallet)))
                    ? 'border-rose-500/60 bg-rose-950/20 text-rose-200 focus:border-rose-500'
                    : 'border-white/[0.08] text-slate-200 focus:border-violet-500'
                }`}
              />
              {Boolean(data.targetWallet && data.targetWallet !== 'Connected Wallet' && !isAddress(String(data.targetWallet))) && (
                <span className="flex items-center gap-1 text-[11px] text-rose-400 mt-1 font-mono">
                  <AlertCircle className="size-3 shrink-0" /> Target must be a valid 0x address or &quot;Connected Wallet&quot;
                </span>
              )}
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Token Tracked</label>
              <input
                type="text"
                value={String(data.tokenAddress || 'Native ETH')}
                onChange={(e) => handleChange('tokenAddress', e.target.value)}
                placeholder="Native ETH or 0xToken..."
                className="w-full bg-[#07080D] border border-white/[0.08] rounded-xl p-2.5 font-mono text-[11px] text-slate-200 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Direction</label>
              <select
                value={String(data.direction || 'Outgoing')}
                onChange={(e) => handleChange('direction', e.target.value)}
                className="w-full bg-[#07080D] border border-white/[0.08] rounded-xl p-2.5 text-white focus:outline-none focus:border-violet-500"
              >
                <option value="Incoming">Incoming Deposits</option>
                <option value="Outgoing">Outgoing Withdrawals</option>
                <option value="Both">Both (Incoming & Outgoing)</option>
              </select>
            </div>
          </div>
        )}

        {/* 1c. Periodic Cron (Node #3) */}
        {type === 'periodicCron' && (
          <div className="space-y-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Interval Frequency</label>
              <input
                type="number"
                min="1"
                value={Number(data.intervalValue ?? 1)}
                onChange={(e) => handleChange('intervalValue', parseInt(e.target.value))}
                className={`w-full bg-[#07080D] border rounded-xl p-2.5 font-bold text-white text-sm focus:outline-none tabular-nums font-mono ${
                  !data.intervalValue || Number(data.intervalValue) <= 0
                    ? 'border-rose-500/60 bg-rose-950/20 text-rose-200 focus:border-rose-500'
                    : 'border-white/[0.08] focus:border-violet-500'
                }`}
              />
              {(!data.intervalValue || Number(data.intervalValue) <= 0) && (
                <span className="flex items-center gap-1 text-[11px] text-rose-400 mt-1 font-mono">
                  <AlertCircle className="size-3 shrink-0" /> Interval must be greater than zero
                </span>
              )}
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Unit</label>
              <select
                value={String(data.intervalUnit || 'Hours')}
                onChange={(e) => handleChange('intervalUnit', e.target.value)}
                className="w-full bg-[#07080D] border border-white/[0.08] rounded-xl p-2.5 text-white focus:outline-none focus:border-violet-500"
              >
                <option value="Minutes">Minutes</option>
                <option value="Hours">Hours</option>
                <option value="Days">Days</option>
              </select>
            </div>

            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-cyan-200 flex gap-2">
              <Clock className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
              <span>Uses CometBFT consensus block ticks on Reactive Omni Lasna to trigger autonomous executions.</span>
            </div>
          </div>
        )}

        {/* 1d. Custom Event Watcher (Node #11) */}
        {type === 'customEventWatcher' && (
          <div className="space-y-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Target Contract Address</label>
              <input
                type="text"
                value={String(data.contractAddress || '')}
                onChange={(e) => handleChange('contractAddress', e.target.value)}
                placeholder="0xContractAddress..."
                className={`w-full bg-[#07080D] border rounded-xl p-2.5 font-mono text-[11px] focus:outline-none ${
                  Boolean(!data.contractAddress || !isAddress(String(data.contractAddress)))
                    ? 'border-rose-500/60 bg-rose-950/20 text-rose-200 focus:border-rose-500'
                    : 'border-white/[0.08] text-slate-200 focus:border-violet-500'
                }`}
              />
              {Boolean(!data.contractAddress || !isAddress(String(data.contractAddress))) && (
                <span className="flex items-center gap-1 text-[11px] text-rose-400 mt-1 font-mono">
                  <AlertCircle className="size-3 shrink-0" /> Valid 0x contract address is required
                </span>
              )}
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Event Signature</label>
              <input
                type="text"
                value={String(data.eventName || '')}
                onChange={(e) => {
                  const val = e.target.value;
                  handleChange('eventName', val);
                  try {
                    const selector = toEventSelector(val);
                    handleChange('topic0', selector);
                  } catch {
                    // typing incomplete signature
                  }
                }}
                placeholder="Transfer(address,address,uint256)"
                className={`w-full bg-[#07080D] border rounded-xl p-2.5 font-mono text-[11px] text-cyan-300 focus:outline-none ${
                  !data.eventName || !String(data.eventName).trim()
                    ? 'border-rose-500/60 bg-rose-950/20 focus:border-rose-500'
                    : 'border-white/[0.08] focus:border-violet-500'
                }`}
              />
              <span className="text-[11px] text-slate-500 mt-1 block font-mono">
                Topic 0: {String(data.topic0 || 'Enter signature to compute')}
              </span>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Origin Network</label>
              <select
                value={Number(data.chainId || 84532)}
                onChange={(e) => handleChange('chainId', parseInt(e.target.value))}
                className="w-full bg-[#07080D] border border-white/[0.08] rounded-xl p-2.5 text-white font-mono text-xs focus:outline-none focus:border-violet-500"
              >
                <option value={84532}>Base Sepolia (84532)</option>
                <option value={1301}>Unichain Sepolia (1301 - Cross-Chain)</option>
              </select>
            </div>
          </div>
        )}

        {/* 2. Price Threshold Guard */}
        {type === 'priceThresholdGuard' && (
          <div className="space-y-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Trigger Condition</label>
              <select
                value={String(data.operator || 'LESS_THAN_OR_EQUAL')}
                onChange={(e) => handleChange('operator', e.target.value)}
                className="w-full bg-[#07080D] border border-white/[0.08] rounded-xl p-2.5 text-white focus:outline-none focus:border-violet-500"
              >
                <option value="LESS_THAN_OR_EQUAL">Price &lt;= Target (Stop-Loss)</option>
                <option value="GREATER_THAN_OR_EQUAL">Price &gt;= Target (Take-Profit)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Threshold Price (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 font-mono">$</span>
                <input
                  type="number"
                  value={Number(data.thresholdPriceUSD ?? 1800)}
                  onChange={(e) => handleChange('thresholdPriceUSD', parseFloat(e.target.value))}
                  className={`w-full bg-[#07080D] border rounded-xl pl-8 pr-3 py-2.5 font-bold text-white text-sm focus:outline-none tabular-nums font-mono ${
                    data.thresholdPriceUSD === undefined || Number(data.thresholdPriceUSD) <= 0 || isNaN(Number(data.thresholdPriceUSD))
                      ? 'border-rose-500/60 bg-rose-950/20 focus:border-rose-500'
                      : 'border-white/[0.08] focus:border-violet-500'
                  }`}
                />
              </div>
              {(data.thresholdPriceUSD === undefined || Number(data.thresholdPriceUSD) <= 0 || isNaN(Number(data.thresholdPriceUSD))) && (
                <span className="flex items-center gap-1 text-[11px] text-rose-400 mt-1 font-mono">
                  <AlertCircle className="size-3 shrink-0" /> Price must be a positive number greater than $0
                </span>
              )}
            </div>

            {/* Quick Price Presets */}
            <div className="flex gap-1.5 pt-1">
              {[1600, 1800, 2000, 2400].map((val) => (
                <button
                  key={val}
                  onClick={() => handleChange('thresholdPriceUSD', val)}
                  className="flex-1 py-1.5 rounded-lg bg-[#07080D] border border-white/[0.08] text-slate-300 hover:text-white hover:border-violet-400 font-mono text-[11px] transition-colors cursor-pointer tabular-nums"
                >
                  ${val}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2b. Price Velocity Guard (Node #14) */}
        {type === 'priceVelocityGuard' && (
          <div className="space-y-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Monitoring Mode</label>
              <select
                value={String(data.direction || 'DROP')}
                onChange={(e) => handleChange('direction', e.target.value)}
                className="w-full bg-[#07080D] border border-white/[0.08] rounded-xl p-2.5 text-white focus:outline-none focus:border-violet-500"
              >
                <option value="DROP">Rapid Flash Dump (Stop-Loss Protection)</option>
                <option value="SURGE">Rapid Flash Surge (Take-Profit Spike)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-400 font-medium">Velocity Drop Threshold</label>
                <span className="font-bold text-rose-400 tabular-nums font-mono">
                  {(Number(data.velocityThresholdBps || 500) / 100).toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="3000"
                step="50"
                value={Number(data.velocityThresholdBps || 500)}
                onChange={(e) => handleChange('velocityThresholdBps', parseInt(e.target.value))}
                className="w-full accent-rose-400 cursor-pointer"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                {Number(data.velocityThresholdBps || 500)} basis points ({((Number(data.velocityThresholdBps || 500)) / 100).toFixed(1)}% drop in window)
              </span>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-400 font-medium">Anchored Sliding Window</label>
                <span className="font-bold text-amber-300 tabular-nums font-mono">
                  {Number(data.windowSeconds || 10)}s
                </span>
              </div>
              <input
                type="range"
                min="3"
                max="60"
                step="1"
                value={Number(data.windowSeconds || 10)}
                onChange={(e) => handleChange('windowSeconds', parseInt(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Anchored sliding window: tracks ΔPrice / Δt across 1s ReactVM blocks
              </span>
            </div>
          </div>
        )}

        {/* 2c. Balance Threshold (Node #6) */}
        {type === 'balanceThreshold' && (
          <div className="space-y-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Account Inspected</label>
              <select
                value={String(data.targetAccount || 'ActionVault')}
                onChange={(e) => handleChange('targetAccount', e.target.value)}
                className="w-full bg-[#07080D] border border-white/[0.08] rounded-xl p-2.5 text-white focus:outline-none focus:border-violet-500"
              >
                <option value="ActionVault">ActionVault Collateral</option>
                <option value="ConnectedWallet">Connected EOA Wallet</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Comparison Rule</label>
              <select
                value={String(data.comparison || 'Above')}
                onChange={(e) => handleChange('comparison', e.target.value)}
                className="w-full bg-[#07080D] border border-white/[0.08] rounded-xl p-2.5 text-white focus:outline-none focus:border-violet-500"
              >
                <option value="Above">Balance &gt;= Target (Dust Guard / Solvent)</option>
                <option value="Below">Balance &lt; Target (Low Balance Warning)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Threshold Amount (ETH)</label>
              <input
                type="number"
                step="0.01"
                min="0.001"
                value={Number(data.thresholdAmount ?? 0.05)}
                onChange={(e) => handleChange('thresholdAmount', parseFloat(e.target.value))}
                className={`w-full bg-[#07080D] border rounded-xl p-2.5 font-bold text-white text-sm focus:outline-none tabular-nums font-mono ${
                  !data.thresholdAmount || Number(data.thresholdAmount) <= 0
                    ? 'border-rose-500/60 bg-rose-950/20 text-rose-200 focus:border-rose-500'
                    : 'border-white/[0.08] focus:border-violet-500'
                }`}
              />
              {(!data.thresholdAmount || Number(data.thresholdAmount) <= 0) && (
                <span className="flex items-center gap-1 text-[11px] text-rose-400 mt-1 font-mono">
                  <AlertCircle className="size-3 shrink-0" /> Threshold amount must be greater than 0
                </span>
              )}
            </div>
          </div>
        )}

        {/* 3. Cooldown Guard */}
        {type === 'cooldownGuard' && (
          <div className="space-y-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Cooldown Duration (Seconds)</label>
              <input
                type="number"
                min="0"
                value={Number(data.cooldownSeconds ?? 300)}
                onChange={(e) => handleChange('cooldownSeconds', parseInt(e.target.value))}
                className={`w-full bg-[#07080D] border rounded-xl p-2.5 font-bold text-white text-sm focus:outline-none tabular-nums font-mono ${
                  data.cooldownSeconds !== undefined && Number(data.cooldownSeconds) < 0
                    ? 'border-rose-500/60 bg-rose-950/20 text-rose-200 focus:border-rose-500'
                    : 'border-white/[0.08] focus:border-violet-500'
                }`}
              />
              {data.cooldownSeconds !== undefined && Number(data.cooldownSeconds) < 0 && (
                <span className="flex items-center gap-1 text-[11px] text-rose-400 mt-1 font-mono">
                  <AlertCircle className="size-3 shrink-0" /> Cooldown cannot be negative
                </span>
              )}
            </div>

            {/* Quick Cooldown Presets */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[
                { label: '60s', val: 60 },
                { label: '5m', val: 300 },
                { label: '15m', val: 900 },
                { label: '1h', val: 3600 },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleChange('cooldownSeconds', item.val)}
                  className="py-1.5 rounded-lg bg-[#07080D] border border-white/[0.08] text-slate-300 hover:text-white hover:border-violet-400 font-medium text-[11px] transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-[11px] text-violet-100 flex gap-2">
              <Info className="w-4 h-4 shrink-0 text-violet-400 mt-0.5" />
              <span>
                Limits repeat callbacks. Once the cooldown ends, a qualifying event can trigger another swap.
              </span>
            </div>
          </div>
        )}

        {/* 4. DEX Swap */}
        {type === 'dexSwap' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Sell Token</label>
                <input
                  type="text"
                  disabled
                  value="ETH"
                  className="w-full bg-[#07080D]/60 border border-white/[0.06] rounded-xl p-2.5 font-bold text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Buy Token</label>
                <input
                  type="text"
                  disabled
                  value="USDC"
                  className="w-full bg-[#07080D]/60 border border-white/[0.06] rounded-xl p-2.5 font-bold text-slate-200"
                />
              </div>
            </div>

            <label className="block space-y-1 text-slate-300">
              <span>Execution policy</span>
              <select value={String(data.executionPolicy ?? 'REPEAT')}
                onChange={e => handleChange('executionPolicy', e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-[#07080D] p-2.5 text-slate-100">
                <option value="REPEAT">Repeat after cooldown</option>
                <option value="ONE_SHOT">Stop after first successful sale</option>
                <option value="LADDER">Ladder using initial principal</option>
              </select>
            </label>

            {ladder ? <label className="block space-y-1 text-slate-300">
              <span>Ladder thresholds and percentages</span>
              <input type="text" value={String(data.ladderSchedule ?? '')}
                onChange={e => handleChange('ladderSchedule', e.target.value)}
                placeholder="1800:20,1600:30,1400:50"
                className="w-full rounded-xl border border-white/[0.08] bg-[#07080D] p-2.5 font-mono text-slate-100" />
              <span className="block">Use descending thresholds. Percentages apply to the initial Vault principal.</span>
            </label> : <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-400 font-medium">Vault Liquidation Amount</label>
                <span className="font-bold text-emerald-400 tabular-nums font-mono">
                  {Number(data.amountPercentage || 50)}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={Number(data.amountPercentage || 50)}
                onChange={(e) => handleChange('amountPercentage', parseInt(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>}

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-400 font-medium">Max Slippage Tolerance</label>
                <span className="font-bold text-emerald-400 tabular-nums font-mono">
                  {STOP_LOSS_TEMPLATE.maxSlippageBps / 100}%
                </span>
              </div>
              <p className="text-slate-400">The Vault uses a fixed limit based on its router quote.</p>
              {data.maxSlippagePercent !== undefined && data.maxSlippagePercent !== STOP_LOSS_TEMPLATE.maxSlippageBps / 100 && (
                <button type="button" className="ws-button mt-2"
                  onClick={() => handleChange('maxSlippagePercent', STOP_LOSS_TEMPLATE.maxSlippageBps / 100)}>
                  Apply Vault limit
                </button>
              )}
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Destination ActionVault</label>
              <input
                type="text"
                value={String(data.actionVaultAddress || '')}
                onChange={(e) => handleChange('actionVaultAddress', e.target.value)}
                placeholder="0xActionVaultAddress..."
                className="w-full bg-[#07080D] border border-white/[0.08] rounded-xl p-2.5 font-mono text-[11px] text-slate-200 focus:outline-none focus:border-violet-500"
              />
            </div>
            {crossChain && <label className="block space-y-1 text-slate-300">
              <span>Base Sepolia settlement pool</span>
              <input type="text" value={String(data.destinationPoolAddress ?? '')}
                onChange={e => handleChange('destinationPoolAddress', e.target.value.trim())}
                className="w-full rounded-xl border border-white/[0.08] bg-[#07080D] p-2.5 font-mono text-slate-100" />
            </label>}
            {phaseTwo && checkingVaults && <p role="status" className="text-slate-300">Checking compatible Vaults?</p>}
            {phaseTwo && vaultLookup?.error && <p role="alert" className="text-rose-300">{vaultLookup.error}</p>}
            {phaseTwo && Boolean(vaultLookup?.vaults?.length) && (
              <label className="block space-y-1">
                <span>Verified Vaults for this pool</span>
                <select className="w-full rounded-md border border-[var(--ws-border)] bg-[#0d0e15] px-2.5 py-2 text-slate-100"
                  value={vaultLookup?.vaults?.includes(String(data.actionVaultAddress).toLowerCase() as Address)
                    ? String(data.actionVaultAddress).toLowerCase() : ''}
                  onChange={event => { if (event.target.value) handleChange('actionVaultAddress', event.target.value); }}>
                  <option value="" disabled>Select Vault</option>
                  {vaultLookup?.vaults?.map(vault => (
                    <option key={vault} value={vault} title={vault}>{vault.slice(0, 8)}?{vault.slice(-6)}</option>
                  ))}
                </select>
              </label>
            )}
            {(!phaseTwo || supportsPriceVault) && owner && typeof vaultPool === 'string' && isAddress(vaultPool) && (
              <VaultSetup key={`${id}:${owner}:${vaultPool}:${phaseTwo}`} owner={owner} pair={vaultPool}
                kind={phaseTwo ? 'price-order' : 'stop-loss'}
                currentVault={String(data.actionVaultAddress || '')} onLinked={vault => handleChange('actionVaultAddress', vault)} />
            )}
          </div>
        )}

        {/* 5. Logic Gate */}
        {type === 'logicGate' && (
          <div className="space-y-3">
            <label className="block space-y-1 text-slate-300">
              <span>Signal freshness (seconds)</span>
              <input type="number" min={1} max={180}
                value={String(data.freshnessSeconds ?? 15)}
                onChange={e => handleChange('freshnessSeconds', Number(e.target.value))}
                className="w-full rounded-xl border border-white/[0.08] bg-[#07080D] p-2.5 font-mono text-slate-100" />
              <span className="block">Measured from when Lasna receives each observation.</span>
            </label>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Boolean Gate Operation</label>
              <select
                value={String(data.gateType || 'AND')}
                onChange={(e) => handleChange('gateType', e.target.value)}
                className="w-full bg-[#07080D] border border-white/[0.08] rounded-xl p-2.5 text-white focus:outline-none focus:border-violet-500"
              >
                <option value="AND">AND (Both conditions required)</option>
                <option value="OR">OR (Either condition passes)</option>
              </select>
            </div>
          </div>
        )}

        {/* 6. Emergency SafeSweep */}
        {type === 'emergencySafeSweep' && (
          <div className="space-y-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Backup Cold Safe Address</label>
              <input
                type="text"
                value={String(data.safeAddress || '')}
                onChange={(e) => handleChange('safeAddress', e.target.value)}
                placeholder="0xColdSafe..."
                className={`w-full bg-[#07080D] border rounded-xl p-2.5 font-mono text-[11px] focus:outline-none ${
                  Boolean(!data.safeAddress || !isAddress(String(data.safeAddress)))
                    ? 'border-rose-500/60 bg-rose-950/20 text-rose-200 focus:border-rose-500'
                    : 'border-white/[0.08] text-slate-200 focus:border-violet-500'
                }`}
              />
              {Boolean(!data.safeAddress || !isAddress(String(data.safeAddress))) && (
                <span className="flex items-center gap-1 text-[11px] text-rose-400 mt-1 font-mono">
                  <AlertCircle className="size-3 shrink-0" /> Valid cold multi-sig address is required
                </span>
              )}
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Asset Scope</label>
              <select
                value={String(data.assetScope || 'ALL')}
                onChange={(e) => handleChange('assetScope', e.target.value)}
                className="w-full bg-[#07080D] border border-white/[0.08] rounded-xl p-2.5 text-white focus:outline-none focus:border-violet-500"
              >
                <option value="ALL">100% ETH + All ERC-20 Tokens</option>
                <option value="ETH_ONLY">ETH Only</option>
              </select>
            </div>
          </div>
        )}

        {/* 7. Notify Log Webhook */}
        {type === 'notifyLogWebhook' && (
          <div className="space-y-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Alert Title</label>
              <input
                type="text"
                value={String(data.alertTitle || '')}
                onChange={(e) => handleChange('alertTitle', e.target.value)}
                placeholder="Alert Message..."
                className={`w-full bg-[#07080D] border rounded-xl p-2.5 text-white focus:outline-none ${
                  !data.alertTitle || !String(data.alertTitle).trim()
                    ? 'border-rose-500/60 bg-rose-950/20 focus:border-rose-500'
                    : 'border-white/[0.08] focus:border-violet-500'
                }`}
              />
              {(!data.alertTitle || !String(data.alertTitle).trim()) && (
                <span className="flex items-center gap-1 text-[11px] text-rose-400 mt-1 font-mono">
                  <AlertCircle className="size-3 shrink-0" /> Alert title cannot be empty
                </span>
              )}
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Severity Level</label>
              <select
                value={String(data.severity || 'WARNING')}
                onChange={(e) => handleChange('severity', e.target.value)}
                className="w-full bg-[#07080D] border border-white/[0.08] rounded-xl p-2.5 text-white focus:outline-none focus:border-violet-500"
              >
                <option value="INFO">INFO</option>
                <option value="WARNING">WARNING</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Footer: Delete Node */}
      <div className="p-4 border-t border-white/[0.08] bg-[#0D0E15]">
        <button
          onClick={() => onDeleteNode(id)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Node</span>
        </button>
      </div>
    </div>
  );
}
