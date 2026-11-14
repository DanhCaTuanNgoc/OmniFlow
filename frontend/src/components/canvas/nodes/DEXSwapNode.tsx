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
      <div className="bg-[#06040A] rounded-none p-2.5 border border-[#1C142E] space-y-2 font-mono text-[11px]">
        <div className="flex justify-between items-center text-zinc-400">
          <span>Action:</span>
          <span className="font-bold text-emerald-400">Swap {fromToken} &rarr; {toToken}</span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-zinc-400">
            <span>Portfolio Liquidation:</span>
            <span className="font-bold text-zinc-100 tabular-nums">{percent}% of Vault</span>
          </div>
          <div className="w-full bg-[#110C1E] rounded-none h-1.5 overflow-hidden border border-[#1C142E]">
            <div
              className="bg-[#00FF9D] h-1.5 rounded-none transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
        <div className="flex justify-between items-center text-[10px] text-zinc-400">
          <span className="flex items-center gap-1">
            <Sliders className="w-3 h-3 text-emerald-400" />
            Max Slippage:
          </span>
          <span className="text-emerald-300 tabular-nums">{slippage}% (MEV Safe)</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-emerald-400/80 font-mono">
        <Layers className="w-3 h-3" />
        <span>emit Callback(ActionVault.executeStopLoss)</span>
      </div>
    </NodeCard>
  );
}

export const DEXSwapNode = memo(DEXSwapNodeComponent);
