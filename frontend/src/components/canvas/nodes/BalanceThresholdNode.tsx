'use client';

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { Coins } from 'lucide-react';
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
      subtitle="Vault Solvency Check"
      icon={<Coins className="size-4" />}
      hasSourceHandle={true}
      hasTargetHandle={true}
      warning={nodeData.warning}
      isOrphan={nodeData.isOrphan}
    >
      <div className="flex items-center justify-between py-0.5">
        <span className="text-[11px] text-[var(--ws-muted)]">Account:</span>
        <span className="text-xs font-semibold text-white font-mono">{targetAccount}</span>
      </div>
      <div className="flex items-center justify-between py-0.5">
        <span className="text-[11px] text-[var(--ws-muted)]">Balance Check:</span>
        <span className="font-medium text-amber-300 font-mono text-xs tabular-nums">{comparison === 'Above' ? '>' : '<'} {threshold} ETH</span>
      </div>
    </NodeCard>
  );
}

export const BalanceThresholdNode = memo(BalanceThresholdNodeComponent);
