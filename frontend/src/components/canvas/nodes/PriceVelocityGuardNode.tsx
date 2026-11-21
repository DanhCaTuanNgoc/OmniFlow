'use client';

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { Activity } from 'lucide-react';
import { NodeCard } from './NodeCard';
import { PriceVelocityGuardData } from '@/types/canvas';

function PriceVelocityGuardNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as PriceVelocityGuardData;
  const velocityBps = nodeData.velocityThresholdBps || 500;
  const velocityPercent = (velocityBps / 100).toFixed(1);
  const windowSeconds = nodeData.windowSeconds || 10;
  const direction = nodeData.direction || 'DROP';

  return (
    <NodeCard
      id={id}
      selected={selected}
      category="condition"
      state={nodeData.state || 'CONFIGURED'}
      title="Price Velocity"
      subtitle="Rapid Price Change Window"
      icon={<Activity className="size-4" />}
      hasSourceHandle={true}
      hasTargetHandle={true}
      warning={nodeData.warning}
      isOrphan={nodeData.isOrphan}
    >
      <div className="flex items-center justify-between py-0.5">
        <span className="text-[11px] text-[var(--ws-muted)]">Rate:</span>
        <span className="font-mono text-rose-400 font-semibold text-xs tabular-nums">
          &gt; {velocityPercent}% {direction === 'DROP' ? 'Drop' : 'Spike'}
        </span>
      </div>
      <div className="flex items-center justify-between py-0.5">
        <span className="text-[11px] text-[var(--ws-muted)]">Window:</span>
        <span className="font-mono text-amber-300 font-medium text-xs tabular-nums">
          {windowSeconds} Seconds
        </span>
      </div>
    </NodeCard>
  );
}

export const PriceVelocityGuardNode = memo(PriceVelocityGuardNodeComponent);
