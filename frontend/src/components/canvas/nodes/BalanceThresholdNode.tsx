'use client';

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { Coins, CheckCircle } from 'lucide-react';
import { NodeCard } from './NodeCard';
import { BalanceThresholdData } from '@/types/canvas';

function BalanceThresholdNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as BalanceThresholdData;
  const targetAccount = nodeData.targetAccount || 'ActionVault';
  const comparison = nodeData.comparison || 'Above';
  const threshold = nodeData.thresholdAmount || 0.05;

  return (
    <NodeCard
      id={id}
      selected={selected}
      category="condition"
      state={nodeData.state || 'IDLE'}
      title="Balance Threshold"
      subtitle="Account Solvency Check"
      icon={<Coins className="w-4 h-4 text-amber-400" />}
      hasSourceHandle={true}
      hasTargetHandle={true}
    >
      <div className="bg-[#06040A] rounded-none p-2.5 border border-[#1C142E] space-y-1.5 font-mono text-[11px]">
        <div className="flex justify-between items-center text-zinc-400">
          <span>Target:</span>
          <span className="font-bold text-zinc-100">{targetAccount}</span>
        </div>
        <div className="flex justify-between items-center text-zinc-400">
          <span>Constraint:</span>
          <span className="font-bold text-amber-400 tabular-nums">Balance {comparison === 'Above' ? '>' : '<'} {threshold} ETH</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-amber-400/80 font-mono">
        <CheckCircle className="w-3 h-3" />
        <span>vault.balance &gt; threshold</span>
      </div>
    </NodeCard>
  );
}

export const BalanceThresholdNode = memo(BalanceThresholdNodeComponent);
