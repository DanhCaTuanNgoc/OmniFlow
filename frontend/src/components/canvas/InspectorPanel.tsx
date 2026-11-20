'use client';

import React from 'react';
import { Node } from '@xyflow/react';
import { X, Sliders, Trash2, Info, Radio, Activity } from 'lucide-react';
import { SUPPORTED_PAIRS, SUPPORTED_CHAINS } from '@/lib/constants';
import { isAddress, toEventSelector, type Address } from 'viem';
import { STOP_LOSS_TEMPLATE } from '@omniflow/shared';
import { VaultSetup } from './VaultSetup';

interface InspectorPanelProps {
  selectedNode: Node | null;
  onUpdateNodeData: (id: string, data: Record<string, any>) => void;
  onDeleteNode: (id: string) => void;
  onClose: () => void;
  owner?: Address;
  originPool?: unknown;
  phaseTwo: boolean;
  crossChain: boolean;
}

export function InspectorPanel({
  selectedNode,
  onUpdateNodeData,
  onDeleteNode,
  onClose,
  owner,
  originPool,
  phaseTwo,
  crossChain,
}: InspectorPanelProps) {
  if (!selectedNode) return null;

  const { id, type, data } = selectedNode;
  const ladder = data.executionPolicy === 'LADDER';

  const handleChange = (field: string, value: any) => {
    onUpdateNodeData(id, {
      [field]: value,
    });
  };

  return (
    <div className="w-full border-l border-[var(--ws-border)] bg-[var(--ws-rail)] flex flex-col h-full text-xs">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.08] bg-[#0D0E15] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-bold text-white tracking-wide">
            Node Inspector
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body: Form Controls */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Node Info Header */}
        <div className="p-3.5 rounded-2xl bg-[#0E1017] border border-white/[0.08] space-y-1 shadow-sm">
          <div className="text-[11px] font-mono text-slate-400">
            Node ID: {id} &bull; {type}
          </div>
          <div className="text-sm font-bold text-white">
            {String(data.label || type)}
          </div>
        </div>

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
                className="w-full bg-[#07080D] border border-white/[0.08] rounded-xl p-2.5 font-mono text-[11px] text-slate-200 focus:outline-none focus:border-violet-500"
              />
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

        {/* 1b. Custom Event Watcher (Node #11) */}
        {type === 'customEventWatcher' && (
          <div className="space-y-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Target Contract Address</label>
              <input
                type="text"
                value={String(data.contractAddress || '')}
                onChange={(e) => handleChange('contractAddress', e.target.value)}
                placeholder="0xContractAddress..."
                className="w-full bg-[#07080D] border border-white/[0.08] rounded-xl p-2.5 font-mono text-[11px] text-slate-200 focus:outline-none focus:border-violet-500"
              />
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
                className="w-full bg-[#07080D] border border-white/[0.08] rounded-xl p-2.5 font-mono text-[11px] text-cyan-300 focus:outline-none focus:border-violet-500"
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
                  className="w-full bg-[#07080D] border border-white/[0.08] rounded-xl pl-8 pr-3 py-2.5 font-bold text-white text-sm focus:outline-none focus:border-violet-500 tabular-nums font-mono"
                />
              </div>
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

        {/* 3. Cooldown Guard */}
        {type === 'cooldownGuard' && (
          <div className="space-y-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Cooldown Duration (Seconds)</label>
              <input
                type="number"
                value={Number(data.cooldownSeconds ?? 300)}
                onChange={(e) => handleChange('cooldownSeconds', parseInt(e.target.value))}
                className="w-full bg-[#07080D] border border-white/[0.08] rounded-xl p-2.5 font-bold text-white text-sm focus:outline-none focus:border-violet-500 tabular-nums font-mono"
              />
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
                className="w-full bg-[#07080D] border border-white/[0.08] rounded-xl p-2.5 font-mono text-[11px] text-slate-200 focus:outline-none focus:border-violet-500"
              />
            </div>
            {crossChain && <label className="block space-y-1 text-slate-300">
              <span>Base Sepolia settlement pool</span>
              <input type="text" value={String(data.destinationPoolAddress ?? '')}
                onChange={e => handleChange('destinationPoolAddress', e.target.value.trim())}
                className="w-full rounded-xl border border-white/[0.08] bg-[#07080D] p-2.5 font-mono text-slate-100" />
            </label>}
            {phaseTwo && <p className="text-slate-300">Phase 2 uses a versioned Price Order Vault. Deploy opens after testnet acceptance.</p>}
            {!phaseTwo && owner && typeof originPool === 'string' && isAddress(originPool) && (
              <VaultSetup key={`${id}:${owner}:${originPool}`} owner={owner} pair={originPool}
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
                className="w-full bg-[#07080D] border border-white/[0.08] rounded-xl p-2.5 font-mono text-[11px] text-slate-200 focus:outline-none focus:border-violet-500"
              />
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
                className="w-full bg-[#07080D] border border-white/[0.08] rounded-xl p-2.5 text-white focus:outline-none focus:border-violet-500"
              />
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
