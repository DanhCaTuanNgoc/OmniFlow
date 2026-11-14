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
      <div className="bg-[#06040A] rounded-none p-2.5 border border-[#1C142E] space-y-1.5 font-mono text-[11px]">
        <div className="flex justify-between items-center text-zinc-400">
          <span>Pair:</span>
          <span className="font-bold text-zinc-100">{pairLabel}</span>
        </div>
        <div className="flex justify-between items-center text-zinc-400">
          <span>DEX:</span>
          <span className="text-cyan-400">{dexRouter}</span>
        </div>
        <div className="flex justify-between items-center text-zinc-400">
          <span>Origin Chain:</span>
          <span className="text-emerald-400 tabular-nums">Base Sepolia ({chainId})</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-cyan-400/80 font-mono">
        <Database className="w-3 h-3" />
        <span>Sync(reserve0, reserve1)</span>
      </div>
    </NodeCard>
  );
}

export const WatchDEXPriceNode = memo(WatchDEXPriceNodeComponent);
