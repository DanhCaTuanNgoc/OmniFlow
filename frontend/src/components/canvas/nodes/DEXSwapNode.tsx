'use client';

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { ArrowDownRight, Layers, Sliders } from 'lucide-react';
import { NodeCard } from './NodeCard';
import { DEXSwapData } from '@/types/canvas';

function DEXSwapNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as DEXSwapData;
  const fromToken = nodeData.fromToken || 'ETH';
  const toToken = nodeData.toToken || 'USDC';
  const percent = nodeData.amountPercentage || 50;
  const slippage = nodeData.maxSlippagePercent || 1;

  return (
    <NodeCard
      id={id}
      selected={selected}
      category="action"
      state={nodeData.state || 'CONFIGURED'}
      title="DEX Token Swap"
      subtitle="Uniswap V2 ActionVault Callback"
      icon={<ArrowDownRight className="w-4 h-4 text-emerald-400" />}
      hasSourceHandle={false}
      hasTargetHandle={true}
    >
      <div className="bg-[#07080d]/80 rounded-xl p-2.5 border border-white/[0.06] space-y-2.5 text-xs">
        <div className="flex justify-between items-center text-slate-400">
          <span>Action:</span>
          <span className="font-semibold text-emerald-300">Swap {fromToken} &rarr; {toToken}</span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Vault Liquidation:</span>
            <span className="text-sm font-bold text-white font-mono tabular-nums">{percent}% of Vault</span>
          </div>
          <div className="w-full bg-[#131620] rounded-full h-1.5 overflow-hidden border border-white/[0.08]">
            <div
              className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-1.5 rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
        <div className="flex justify-between items-center text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Sliders className="w-3 h-3 text-emerald-400" />
            Max Slippage:
          </span>
          <span className="font-medium text-emerald-300 tabular-nums">{slippage}% (MEV Guarded)</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-emerald-400/80 font-mono">
        <Layers className="w-3.5 h-3.5" />
        <span>ActionVault.executeStopLoss()</span>
      </div>
    </NodeCard>
  );
}

export const DEXSwapNode = memo(DEXSwapNodeComponent);
