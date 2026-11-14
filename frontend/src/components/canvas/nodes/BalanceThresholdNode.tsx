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
      <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 space-y-1.5">
        <div className="flex justify-between items-center text-slate-400">
          <span>Target:</span>
          <span className="font-semibold text-slate-100">{targetAccount}</span>
        </div>
        <div className="flex justify-between items-center text-slate-400">
          <span>Constraint:</span>
          <span className="font-mono text-amber-400">Balance {comparison === 'Above' ? '>' : '<'} {threshold} ETH</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-amber-400/80">
        <CheckCircle className="w-3.5 h-3.5" />
        <span>vault.balance &gt; threshold</span>
      </div>
    </NodeCard>
  );
}

export const BalanceThresholdNode = memo(BalanceThresholdNodeComponent);
