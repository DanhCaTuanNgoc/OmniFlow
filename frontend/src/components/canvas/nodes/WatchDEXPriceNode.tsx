'use client';

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { TrendingDown, Database } from 'lucide-react';
import { NodeCard } from './NodeCard';
import { WatchDEXPriceData } from '@/types/canvas';

function WatchDEXPriceNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as WatchDEXPriceData;
  const pairLabel = nodeData.pairLabel || 'ETH / USDC';
  const dexRouter = nodeData.dexRouter || 'Uniswap V2';
  const chainId = nodeData.chainId || 84532;

  return (
    <NodeCard
      id={id}
      selected={selected}
      category="trigger"
      state={nodeData.state || 'LISTENING'}
      title="Watch DEX Price"
      subtitle="AMM Pair Sync Stream"
      icon={<TrendingDown className="w-4 h-4 text-cyan-400" />}
      hasSourceHandle={true}
      hasTargetHandle={false}
    >
      <div className="bg-[#07080d]/80 rounded-xl p-2.5 border border-white/[0.06] space-y-2 text-xs">
        <div className="flex justify-between items-center text-slate-400">
          <span>Pair:</span>
          <span className="text-sm font-semibold text-white font-mono">{pairLabel}</span>
        </div>
        <div className="flex justify-between items-center text-slate-400">
          <span>DEX Router:</span>
          <span className="text-cyan-300 font-medium font-mono">{dexRouter}</span>
        </div>
        <div className="flex justify-between items-center text-slate-400">
          <span>Origin Chain:</span>
          <span className="text-emerald-400 font-medium font-mono text-[11px] tabular-nums">Base Sepolia ({chainId})</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-cyan-400/80 font-mono">
        <Database className="w-3.5 h-3.5" />
        <span>Sync(reserve0, reserve1)</span>
      </div>
    </NodeCard>
  );
}

export const WatchDEXPriceNode = memo(WatchDEXPriceNodeComponent);
