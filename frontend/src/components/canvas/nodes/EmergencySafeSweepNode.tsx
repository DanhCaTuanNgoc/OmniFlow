'use client';

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { ShieldCheck } from 'lucide-react';
import { NodeCard } from './NodeCard';
import { EmergencySafeSweepData } from '@/types/canvas';
import { truncateAddress } from '@/lib/utils';

function EmergencySafeSweepNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as EmergencySafeSweepData;
  const safeAddress = nodeData.safeAddress;
  const assetScope = nodeData.assetScope || 'ALL';

  return (
    <NodeCard
      id={id}
      selected={selected}
      category="action"
      state={nodeData.state || 'IDLE'}
      title="Emergency SafeSweep"
      subtitle="Non-Custodial Cold Evac"
      icon={<ShieldCheck className="size-4" />}
      hasSourceHandle={false}
      hasTargetHandle={true}
    >
      <div className="flex items-center justify-between py-0.5">
        <span className="text-[11px] text-[var(--ws-muted)]">Safe Destination:</span>
        <span className="font-mono text-white text-xs font-medium">{safeAddress ? truncateAddress(safeAddress) : 'Panic Cold Wallet'}</span>
      </div>
      <div className="flex items-center justify-between py-0.5">
        <span className="text-[11px] text-[var(--ws-muted)]">Scope:</span>
        <span className="text-xs font-semibold text-emerald-300">{assetScope === 'ALL' ? '100% ETH + ERC20' : 'ETH Only'}</span>
      </div>
    </NodeCard>
  );
}

export const EmergencySafeSweepNode = memo(EmergencySafeSweepNodeComponent);
