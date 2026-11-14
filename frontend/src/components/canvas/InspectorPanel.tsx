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
    <div className="w-80 border-l border-[#1C142E] bg-[#0B0813] flex flex-col h-full z-10 select-none font-mono text-xs">
      {/* Header */}
      <div className="p-3.5 border-b border-[#1C142E] bg-[#06040A] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#8B5CF6]" />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
            NODE INSPECTOR
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-none text-zinc-500 hover:text-white hover:bg-[#110C1E] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body: Form Controls */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Node Info Header (Tech Corner Accent) */}
        <div className="tech-corner-accent p-3 rounded-none bg-[#06040A] border border-[#1C142E] space-y-1">
          <div className="text-[10px] font-mono text-[#C084FC] uppercase tracking-wider">
            NODE: {id} &bull; {type}
          </div>
          <div className="text-sm font-bold text-zinc-100 uppercase tracking-wide">
            {String(data.label || type)}
          </div>
        </div>

        {/* 1. Watch DEX Price */}
        {type === 'watchDEXPrice' && (
          <div className="space-y-3">
            <div>
              <label className="block text-zinc-400 mb-1 uppercase text-[10px] tracking-wider">Trading Pair</label>
              <select
                value={String(data.pairLabel || 'ETH / USDC')}
                onChange={(e) => {
                  const found = SUPPORTED_PAIRS.find((p) => p.label === e.target.value);
                  handleChange('pairLabel', e.target.value);
                  if (found) handleChange('pairAddress', found.address);
                }}
                className="w-full bg-[#06040A] border border-[#1C142E] rounded-none p-2 text-zinc-200 focus:outline-none focus:border-[#8B5CF6]"
              >
                {SUPPORTED_PAIRS.map((p) => (
                  <option key={p.label} value={p.label}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1 uppercase text-[10px] tracking-wider">Pair Contract Address</label>
              <input
                type="text"
                value={String(data.pairAddress || '')}
                onChange={(e) => handleChange('pairAddress', e.target.value)}
                className="w-full bg-[#06040A] border border-[#1C142E] rounded-none p-2 font-mono text-[11px] text-zinc-300 focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1 uppercase text-[10px] tracking-wider">Origin Chain ID</label>
              <input
                type="number"
                disabled
                value={84532}
                className="w-full bg-[#06040A]/50 border border-[#1C142E] rounded-none p-2 font-mono text-zinc-500 cursor-not-allowed tabular-nums"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Base Sepolia (200ms Denim block execution)
              </span>
            </div>
          </div>
        )}

        {/* 2. Price Threshold Guard */}
        {type === 'priceThresholdGuard' && (
          <div className="space-y-3">
            <div>
              <label className="block text-zinc-400 mb-1 uppercase text-[10px] tracking-wider">Trigger Condition</label>
              <select
                value={String(data.operator || 'LESS_THAN_OR_EQUAL')}
                onChange={(e) => handleChange('operator', e.target.value)}
                className="w-full bg-[#06040A] border border-[#1C142E] rounded-none p-2 text-zinc-200 focus:outline-none focus:border-[#8B5CF6]"
              >
                <option value="LESS_THAN_OR_EQUAL">Price &lt;= Target (Stop-Loss)</option>
                <option value="GREATER_THAN_OR_EQUAL">Price &gt;= Target (Take-Profit)</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1 uppercase text-[10px] tracking-wider">Threshold Price (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-zinc-500 font-mono">$</span>
                <input
                  type="number"
                  value={Number(data.thresholdPriceUSD || 1800)}
                  onChange={(e) => handleChange('thresholdPriceUSD', parseFloat(e.target.value))}
                  className="w-full bg-[#06040A] border border-[#1C142E] rounded-none pl-7 pr-3 py-2 font-mono font-bold text-zinc-100 text-sm focus:outline-none focus:border-[#8B5CF6] tabular-nums"
                />
              </div>
            </div>

            {/* Quick Price Presets */}
            <div className="flex gap-1.5 pt-1">
              {[1600, 1800, 2000, 2400].map((val) => (
                <button
                  key={val}
                  onClick={() => handleChange('thresholdPriceUSD', val)}
                  className="flex-1 py-1 rounded-none bg-[#06040A] border border-[#1C142E] text-zinc-400 hover:text-amber-300 hover:border-amber-500/50 font-mono text-[10px] transition-colors cursor-pointer tabular-nums"
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
              <label className="block text-zinc-400 mb-1 uppercase text-[10px] tracking-wider">Cooldown Duration (Seconds)</label>
              <input
                type="number"
                value={Number(data.cooldownSeconds || 300)}
                onChange={(e) => handleChange('cooldownSeconds', parseInt(e.target.value))}
                className="w-full bg-[#06040A] border border-[#1C142E] rounded-none p-2 font-mono font-bold text-zinc-100 text-sm focus:outline-none focus:border-[#8B5CF6] tabular-nums"
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
                  className="py-1 rounded-none bg-[#06040A] border border-[#1C142E] text-zinc-400 hover:text-amber-300 hover:border-amber-500/50 font-mono text-[10px] transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="p-2.5 rounded-none bg-amber-950/20 border border-amber-900/40 text-[11px] text-amber-300/90 flex gap-2">
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
                <label className="block text-zinc-400 mb-1 uppercase text-[10px] tracking-wider">Sell Token</label>
                <input
                  type="text"
                  disabled
                  value="ETH"
                  className="w-full bg-[#06040A]/60 border border-[#1C142E] rounded-none p-2 font-mono font-bold text-zinc-300"
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1 uppercase text-[10px] tracking-wider">Buy Token</label>
                <input
                  type="text"
                  disabled
                  value="USDC"
                  className="w-full bg-[#06040A]/60 border border-[#1C142E] rounded-none p-2 font-mono font-bold text-zinc-300"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-zinc-400 uppercase text-[10px] tracking-wider">Vault Liquidation Amount</label>
                <span className="font-mono font-bold text-emerald-400 tabular-nums">
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
                <label className="text-zinc-400 uppercase text-[10px] tracking-wider">Max Slippage Tolerance</label>
                <span className="font-mono font-bold text-emerald-400 tabular-nums">
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
              <label className="block text-zinc-400 mb-1 uppercase text-[10px] tracking-wider">Destination ActionVault</label>
              <input
                type="text"
                value={String(data.actionVaultAddress || '0xABCDEF0123456789ABCDEF0123456789ABCDEF01')}
                onChange={(e) => handleChange('actionVaultAddress', e.target.value)}
                className="w-full bg-[#06040A] border border-[#1C142E] rounded-none p-2 font-mono text-[11px] text-zinc-300 focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
          </div>
        )}

        {/* 5. Logic Gate */}
        {type === 'logicGate' && (
          <div className="space-y-3">
            <div>
              <label className="block text-zinc-400 mb-1 uppercase text-[10px] tracking-wider">Boolean Gate Operation</label>
              <select
                value={String(data.gateType || 'AND')}
                onChange={(e) => handleChange('gateType', e.target.value)}
                className="w-full bg-[#06040A] border border-[#1C142E] rounded-none p-2 text-zinc-200 focus:outline-none focus:border-[#8B5CF6]"
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
              <label className="block text-zinc-400 mb-1 uppercase text-[10px] tracking-wider">Backup Cold Safe Address</label>
              <input
                type="text"
                value={String(data.safeAddress || '')}
                onChange={(e) => handleChange('safeAddress', e.target.value)}
                placeholder="0xColdSafe..."
                className="w-full bg-[#06040A] border border-[#1C142E] rounded-none p-2 font-mono text-[11px] text-zinc-300 focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 uppercase text-[10px] tracking-wider">Asset Scope</label>
              <select
                value={String(data.assetScope || 'ALL')}
                onChange={(e) => handleChange('assetScope', e.target.value)}
                className="w-full bg-[#06040A] border border-[#1C142E] rounded-none p-2 text-zinc-200 focus:outline-none focus:border-[#8B5CF6]"
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
              <label className="block text-zinc-400 mb-1 uppercase text-[10px] tracking-wider">Alert Title</label>
              <input
                type="text"
                value={String(data.alertTitle || '')}
                onChange={(e) => handleChange('alertTitle', e.target.value)}
                className="w-full bg-[#06040A] border border-[#1C142E] rounded-none p-2 text-zinc-200 focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 uppercase text-[10px] tracking-wider">Severity Level</label>
              <select
                value={String(data.severity || 'WARNING')}
                onChange={(e) => handleChange('severity', e.target.value)}
                className="w-full bg-[#06040A] border border-[#1C142E] rounded-none p-2 text-zinc-200 focus:outline-none focus:border-[#8B5CF6]"
              >
                <option value="INFO">INFO</option>
                <option value="WARNING">WARNING</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Footer: Delete Node (Snippet 6.1 Danger Button) */}
      <div className="p-3 border-t border-[#1C142E] bg-[#06040A]">
        <button
          onClick={() => onDeleteNode(id)}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-none bg-[#16080E] hover:bg-rose-950/70 text-rose-300 hover:text-rose-100 border border-rose-800/60 hover:border-rose-600 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>DELETE NODE</span>
        </button>
      </div>
    </div>
  );
}
