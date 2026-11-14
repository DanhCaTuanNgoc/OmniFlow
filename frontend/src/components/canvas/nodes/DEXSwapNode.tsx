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
      <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 space-y-2">
        <div className="flex justify-between items-center text-slate-400">
          <span>Action:</span>
          <span className="font-bold text-emerald-400">Swap {fromToken} &rarr; {toToken}</span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Portfolio Liquidation:</span>
            <span className="font-bold text-slate-100 tabular-nums">{percent}% of Vault</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-400 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
        <div className="flex justify-between items-center text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Sliders className="w-3 h-3 text-emerald-400" />
            Max Slippage:
          </span>
          <span className="font-mono text-emerald-300">{slippage}% (MEV Safe)</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-emerald-400/80">
        <Layers className="w-3.5 h-3.5" />
        <span>emit Callback(ActionVault.executeStopLoss)</span>
      </div>
    </NodeCard>
  );
}

export const DEXSwapNode = memo(DEXSwapNodeComponent);
