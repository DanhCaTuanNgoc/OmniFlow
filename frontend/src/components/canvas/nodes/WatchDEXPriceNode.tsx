'use client';

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { TrendingDown } from 'lucide-react';
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
      subtitle="Uniswap V2 Pool Sync"
      icon={<TrendingDown className="size-4" />}
      hasSourceHandle={true}
      hasTargetHandle={false}
    >
      <div className="flex items-center justify-between py-0.5">
        <span className="text-[11px] text-[var(--ws-muted)]">Pair:</span>
        <span className="text-xs font-semibold text-white font-mono">{pairLabel}</span>
      </div>
      <div className="flex items-center justify-between py-0.5">
        <span className="text-[11px] text-[var(--ws-muted)]">DEX Router:</span>
        <span className="text-xs text-zinc-300 font-mono">{dexRouter}</span>
      </div>
      <div className="flex items-center justify-between py-0.5">
        <span className="text-[11px] text-[var(--ws-muted)]">Origin Chain:</span>
        <span className="text-[11px] font-mono text-sky-400 tabular-nums">Base Sepolia ({chainId})</span>
      </div>
    </NodeCard>
  );
}

export const WatchDEXPriceNode = memo(WatchDEXPriceNodeComponent);
