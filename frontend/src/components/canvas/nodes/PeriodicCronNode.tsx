'use client';

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { Clock } from 'lucide-react';
import { NodeCard } from './NodeCard';
import { PeriodicCronData } from '@/types/canvas';

function PeriodicCronNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as PeriodicCronData;
  const interval = nodeData.intervalValue || 1;
  const unit = nodeData.intervalUnit || 'Hours';

  return (
    <NodeCard
      id={id}
      selected={selected}
      category="trigger"
      state={nodeData.state || 'IDLE'}
      title="Periodic Cron"
      subtitle="Scheduled Interval Timer"
      icon={<Clock className="size-4" />}
      hasSourceHandle={true}
      hasTargetHandle={false}
    >
      <div className="flex items-center justify-between py-0.5">
        <span className="text-[11px] text-[var(--ws-muted)]">Schedule:</span>
        <span className="text-xs font-semibold text-white">Every {interval} {unit}</span>
      </div>
      <div className="flex items-center justify-between py-0.5">
        <span className="text-[11px] text-[var(--ws-muted)]">Engine:</span>
        <span className="text-xs text-zinc-300 font-mono">CometBFT Block Tick</span>
      </div>
    </NodeCard>
  );
}

export const PeriodicCronNode = memo(PeriodicCronNodeComponent);
