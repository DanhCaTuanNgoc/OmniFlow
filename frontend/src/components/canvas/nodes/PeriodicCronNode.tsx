'use client';

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { Clock, RefreshCw } from 'lucide-react';
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
      subtitle="Reactive System Timer"
      icon={<Clock className="w-4 h-4 text-cyan-400" />}
      hasSourceHandle={true}
      hasTargetHandle={false}
    >
      <div className="bg-[#0D0819]/90 rounded-xl p-2.5 border border-[#2E1E54]/60 space-y-2 text-xs">
        <div className="flex justify-between items-center text-purple-300/70">
          <span>Schedule:</span>
          <span className="font-semibold text-white">Every {interval} {unit}</span>
        </div>
        <div className="flex justify-between items-center text-purple-300/70">
          <span>Engine:</span>
          <span className="text-cyan-300">ReactVM System Block Tick</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-cyan-400/80 font-mono">
        <RefreshCw className="w-3.5 h-3.5" />
        <span>tickTimestamp, blockNumber</span>
      </div>
    </NodeCard>
  );
}

export const PeriodicCronNode = memo(PeriodicCronNodeComponent);
