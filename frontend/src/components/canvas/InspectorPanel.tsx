'use client';

import React from 'react';
import { Node } from '@xyflow/react';
import { X, Sliders, Trash2, Info } from 'lucide-react';
import { SUPPORTED_PAIRS } from '@/lib/constants';

interface InspectorPanelProps {
  selectedNode: Node | null;
  onUpdateNodeData: (id: string, data: Record<string, any>) => void;
  onDeleteNode: (id: string) => void;
  onClose: () => void;
}

export function InspectorPanel({
  selectedNode,
  onUpdateNodeData,
  onDeleteNode,
  onClose,
}: InspectorPanelProps) {
  if (!selectedNode) return null;

  const { id, type, data } = selectedNode;

  const handleChange = (field: string, value: any) => {
    onUpdateNodeData(id, {
      ...data,
      [field]: value,
    });
  };

  return (
    <div className="w-80 border-l border-[#2E1E54]/60 bg-[#0B0716] flex flex-col h-full z-10 select-none text-xs">
      {/* Header */}
      <div className="p-4 border-b border-[#2E1E54]/60 bg-[#0E091C]/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-bold text-white tracking-wide">
            Node Inspector
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl text-purple-300/60 hover:text-white hover:bg-[#150E28] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body: Form Controls */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Node Info Header */}
        <div className="p-3.5 rounded-2xl bg-[#110B1F] border border-purple-900/30 space-y-1 shadow-sm">
          <div className="text-[11px] font-mono text-purple-300/70">
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
              <label className="block text-purple-300/70 mb-1 font-medium">Trading Pair</label>
              <select
                value={String(data.pairLabel || 'ETH / USDC')}
                onChange={(e) => {
                  const found = SUPPORTED_PAIRS.find((p) => p.label === e.target.value);
                  handleChange('pairLabel', e.target.value);
                  if (found) handleChange('pairAddress', found.address);
                }}
                className="w-full bg-[#150E28] border border-purple-900/40 rounded-xl p-2.5 text-white focus:outline-none focus:border-violet-500"
              >
                {SUPPORTED_PAIRS.map((p) => (
                  <option key={p.label} value={p.label}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-purple-300/70 mb-1 font-medium">Pair Contract Address</label>
              <input
                type="text"
                value={String(data.pairAddress || '')}
                onChange={(e) => handleChange('pairAddress', e.target.value)}
                className="w-full bg-[#150E28] border border-purple-900/40 rounded-xl p-2.5 font-mono text-[11px] text-purple-200 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-purple-300/70 mb-1 font-medium">Origin Chain ID</label>
              <input
                type="number"
                disabled
                value={84532}
                className="w-full bg-[#150E28]/50 border border-purple-900/30 rounded-xl p-2.5 font-mono text-purple-400/50 cursor-not-allowed tabular-nums"
              />
              <span className="text-[11px] text-purple-300/60 mt-1 block">
                Base Sepolia (200ms Denim block execution)
              </span>
            </div>
          </div>
        )}

        {/* 2. Price Threshold Guard */}
        {type === 'priceThresholdGuard' && (
          <div className="space-y-3">
            <div>
              <label className="block text-purple-300/70 mb-1 font-medium">Trigger Condition</label>
              <select
                value={String(data.operator || 'LESS_THAN_OR_EQUAL')}
                onChange={(e) => handleChange('operator', e.target.value)}
                className="w-full bg-[#150E28] border border-purple-900/40 rounded-xl p-2.5 text-white focus:outline-none focus:border-violet-500"
              >
                <option value="LESS_THAN_OR_EQUAL">Price &lt;= Target (Stop-Loss)</option>
                <option value="GREATER_THAN_OR_EQUAL">Price &gt;= Target (Take-Profit)</option>
              </select>
            </div>

            <div>
              <label className="block text-purple-300/70 mb-1 font-medium">Threshold Price (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-purple-400/60 font-mono">$</span>
                <input
                  type="number"
                  value={Number(data.thresholdPriceUSD || 1800)}
                  onChange={(e) => handleChange('thresholdPriceUSD', parseFloat(e.target.value))}
                  className="w-full bg-[#150E28] border border-purple-900/40 rounded-xl pl-8 pr-3 py-2.5 font-bold text-white text-sm focus:outline-none focus:border-violet-500 tabular-nums"
                />
              </div>
            </div>

            {/* Quick Price Presets */}
            <div className="flex gap-1.5 pt-1">
              {[1600, 1800, 2000, 2400].map((val) => (
                <button
                  key={val}
                  onClick={() => handleChange('thresholdPriceUSD', val)}
                  className="flex-1 py-1.5 rounded-lg bg-[#150E28] border border-purple-900/30 text-purple-300 hover:text-white hover:border-violet-400 font-mono text-[11px] transition-colors cursor-pointer tabular-nums"
                >
                  ${val}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. Cooldown Guard */}
        {type === 'cooldownGuard' && (
          <div className="space-y-3">
            <div>
              <label className="block text-purple-300/70 mb-1 font-medium">Cooldown Duration (Seconds)</label>
              <input
                type="number"
                value={Number(data.cooldownSeconds || 300)}
                onChange={(e) => handleChange('cooldownSeconds', parseInt(e.target.value))}
                className="w-full bg-[#150E28] border border-purple-900/40 rounded-xl p-2.5 font-bold text-white text-sm focus:outline-none focus:border-violet-500 tabular-nums"
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
                  className="py-1.5 rounded-lg bg-[#150E28] border border-purple-900/30 text-purple-300 hover:text-white hover:border-violet-400 font-medium text-[11px] transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/40 text-[11px] text-purple-300/90 flex gap-2">
              <Info className="w-4 h-4 shrink-0 text-violet-400 mt-0.5" />
              <span>
                Protects against rapid Base 200ms multi-callback storms and reverts.
              </span>
            </div>
          </div>
        )}

        {/* 4. DEX Swap */}
        {type === 'dexSwap' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-purple-300/70 mb-1 font-medium">Sell Token</label>
                <input
                  type="text"
                  disabled
                  value="ETH"
                  className="w-full bg-[#150E28]/60 border border-purple-900/30 rounded-xl p-2.5 font-bold text-slate-200"
                />
              </div>
              <div>
                <label className="block text-purple-300/70 mb-1 font-medium">Buy Token</label>
                <input
                  type="text"
                  disabled
                  value="USDC"
                  className="w-full bg-[#150E28]/60 border border-purple-900/30 rounded-xl p-2.5 font-bold text-slate-200"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-purple-300/70 font-medium">Vault Liquidation Amount</label>
                <span className="font-bold text-emerald-400 tabular-nums">
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
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-purple-300/70 font-medium">Max Slippage Tolerance</label>
                <span className="font-bold text-emerald-400 tabular-nums">
                  {Number(data.maxSlippagePercent || 1)}%
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.5"
                value={Number(data.maxSlippagePercent || 1)}
                onChange={(e) => handleChange('maxSlippagePercent', parseFloat(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-purple-300/70 mb-1 font-medium">Destination ActionVault</label>
              <input
                type="text"
                value={String(data.actionVaultAddress || '0xABCDEF0123456789ABCDEF0123456789ABCDEF01')}
                onChange={(e) => handleChange('actionVaultAddress', e.target.value)}
                className="w-full bg-[#150E28] border border-purple-900/40 rounded-xl p-2.5 font-mono text-[11px] text-purple-200 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
        )}

        {/* 5. Logic Gate */}
        {type === 'logicGate' && (
          <div className="space-y-3">
            <div>
              <label className="block text-purple-300/70 mb-1 font-medium">Boolean Gate Operation</label>
              <select
                value={String(data.gateType || 'AND')}
                onChange={(e) => handleChange('gateType', e.target.value)}
                className="w-full bg-[#150E28] border border-purple-900/40 rounded-xl p-2.5 text-white focus:outline-none focus:border-violet-500"
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
              <label className="block text-purple-300/70 mb-1 font-medium">Backup Cold Safe Address</label>
              <input
                type="text"
                value={String(data.safeAddress || '')}
                onChange={(e) => handleChange('safeAddress', e.target.value)}
                placeholder="0xColdSafe..."
                className="w-full bg-[#150E28] border border-purple-900/40 rounded-xl p-2.5 font-mono text-[11px] text-purple-200 focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-purple-300/70 mb-1 font-medium">Asset Scope</label>
              <select
                value={String(data.assetScope || 'ALL')}
                onChange={(e) => handleChange('assetScope', e.target.value)}
                className="w-full bg-[#150E28] border border-purple-900/40 rounded-xl p-2.5 text-white focus:outline-none focus:border-violet-500"
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
              <label className="block text-purple-300/70 mb-1 font-medium">Alert Title</label>
              <input
                type="text"
                value={String(data.alertTitle || '')}
                onChange={(e) => handleChange('alertTitle', e.target.value)}
                className="w-full bg-[#150E28] border border-purple-900/40 rounded-xl p-2.5 text-white focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-purple-300/70 mb-1 font-medium">Severity Level</label>
              <select
                value={String(data.severity || 'WARNING')}
                onChange={(e) => handleChange('severity', e.target.value)}
                className="w-full bg-[#150E28] border border-purple-900/40 rounded-xl p-2.5 text-white focus:outline-none focus:border-violet-500"
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
      <div className="p-4 border-t border-[#2E1E54]/60 bg-[#0E091C]/60">
        <button
          onClick={() => onDeleteNode(id)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border border-rose-800/40 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Node</span>
        </button>
      </div>
    </div>
  );
}
