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
      <div className="bg-[#0D0819]/90 rounded-xl p-2.5 border border-[#2E1E54]/60 space-y-2 text-xs">
        <div className="flex justify-between items-center text-purple-300/70">
          <span>Target:</span>
          <span className="font-semibold text-white">{targetAccount}</span>
        </div>
        <div className="flex justify-between items-center text-purple-300/70">
          <span>Constraint:</span>
          <span className="font-medium text-amber-300 tabular-nums">Balance {comparison === 'Above' ? '>' : '<'} {threshold} ETH</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-amber-400/80 font-mono">
        <CheckCircle className="w-3.5 h-3.5" />
        <span>vault.balance &gt; threshold</span>
      </div>
    </NodeCard>
  );
}

export const BalanceThresholdNode = memo(BalanceThresholdNodeComponent);
