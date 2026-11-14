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
    <div className="w-80 border-l border-slate-800 bg-[#0B1120] flex flex-col h-full z-10 select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Node Inspector
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body: Form Controls */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Node Info Header */}
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] font-mono text-cyan-400 uppercase">
            ID: {id} &bull; {type}
          </div>
          <div className="text-sm font-semibold text-slate-100">{String(data.label || type)}</div>
        </div>

        {/* 1. Watch DEX Price */}
        {type === 'watchDEXPrice' && (
          <div className="space-y-3">
            <div>
              <label className="block text-slate-400 mb-1">Trading Pair</label>
              <select
                value={String(data.pairLabel || 'ETH / USDC')}
                onChange={(e) => {
                  const found = SUPPORTED_PAIRS.find((p) => p.label === e.target.value);
                  handleChange('pairLabel', e.target.value);
                  if (found) handleChange('pairAddress', found.address);
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {SUPPORTED_PAIRS.map((p) => (
                  <option key={p.label} value={p.label}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Pair Contract Address</label>
              <input
                type="text"
                value={String(data.pairAddress || '')}
                onChange={(e) => handleChange('pairAddress', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 font-mono text-[11px] text-slate-300 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Origin Chain ID</label>
              <input
                type="number"
                disabled
                value={84532}
                className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2 font-mono text-slate-500 cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Base Sepolia (200ms Denim block execution)
              </span>
            </div>
          </div>
        )}

        {/* 2. Price Threshold Guard */}
        {type === 'priceThresholdGuard' && (
          <div className="space-y-3">
            <div>
              <label className="block text-slate-400 mb-1">Trigger Condition</label>
              <select
                value={String(data.operator || 'LESS_THAN_OR_EQUAL')}
                onChange={(e) => handleChange('operator', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="LESS_THAN_OR_EQUAL">Price &lt;= Target (Stop-Loss)</option>
                <option value="GREATER_THAN_OR_EQUAL">Price &gt;= Target (Take-Profit)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Threshold Price (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-500 font-mono">$</span>
                <input
                  type="number"
                  value={Number(data.thresholdPriceUSD || 1800)}
                  onChange={(e) => handleChange('thresholdPriceUSD', parseFloat(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-7 pr-3 py-2 font-mono font-bold text-slate-100 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Quick Price Presets */}
            <div className="flex gap-1.5 pt-1">
              {[1600, 1800, 2000, 2400].map((val) => (
                <button
                  key={val}
                  onClick={() => handleChange('thresholdPriceUSD', val)}
                  className="flex-1 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-300 hover:border-amber-500/50 font-mono text-[10px] transition-colors"
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
              <label className="block text-slate-400 mb-1">Cooldown Duration (Seconds)</label>
              <input
                type="number"
                value={Number(data.cooldownSeconds || 300)}
                onChange={(e) => handleChange('cooldownSeconds', parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 font-mono font-bold text-slate-100 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Quick Cooldown Presets */}
            <div className="grid grid-cols-4 gap-1 pt-1">
              {[
                { label: '60s', val: 60 },
                { label: '5m', val: 300 },
                { label: '15m', val: 900 },
                { label: '1h', val: 3600 },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleChange('cooldownSeconds', item.val)}
                  className="py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-300 hover:border-amber-500/50 font-mono text-[10px] transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-900/40 text-[11px] text-amber-300/90 flex gap-2">
              <Info className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
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
                <label className="block text-slate-400 mb-1">Sell Token</label>
                <input
                  type="text"
                  disabled
                  value="ETH"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-2 font-mono font-bold text-slate-300"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Buy Token</label>
                <input
                  type="text"
                  disabled
                  value="USDC"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-2 font-mono font-bold text-slate-300"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-400">Vault Liquidation Amount</label>
                <span className="font-mono font-bold text-emerald-400">
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
                <label className="text-slate-400">Max Slippage Tolerance</label>
                <span className="font-mono font-bold text-emerald-400">
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
              <label className="block text-slate-400 mb-1">Destination ActionVault</label>
              <input
                type="text"
                value={String(data.actionVaultAddress || '0xABCDEF0123456789ABCDEF0123456789ABCDEF01')}
                onChange={(e) => handleChange('actionVaultAddress', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 font-mono text-[11px] text-slate-300 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        )}

        {/* 5. Logic Gate */}
        {type === 'logicGate' && (
          <div className="space-y-3">
            <div>
              <label className="block text-slate-400 mb-1">Boolean Gate Operation</label>
              <select
                value={String(data.gateType || 'AND')}
                onChange={(e) => handleChange('gateType', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-purple-500"
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
              <label className="block text-slate-400 mb-1">Backup Cold Safe Address</label>
              <input
                type="text"
                value={String(data.safeAddress || '')}
                onChange={(e) => handleChange('safeAddress', e.target.value)}
                placeholder="0xColdSafe..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 font-mono text-[11px] text-slate-300 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Asset Scope</label>
              <select
                value={String(data.assetScope || 'ALL')}
                onChange={(e) => handleChange('assetScope', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500"
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
              <label className="block text-slate-400 mb-1">Alert Title</label>
              <input
                type="text"
                value={String(data.alertTitle || '')}
                onChange={(e) => handleChange('alertTitle', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Severity Level</label>
              <select
                value={String(data.severity || 'WARNING')}
                onChange={(e) => handleChange('severity', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500"
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
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <button
          onClick={() => onDeleteNode(id)}
          className="w-full py-2 px-3 rounded-lg bg-red-950/30 hover:bg-red-900/50 border border-red-900/50 text-red-400 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete Node
        </button>
      </div>
    </div>
  );
}
