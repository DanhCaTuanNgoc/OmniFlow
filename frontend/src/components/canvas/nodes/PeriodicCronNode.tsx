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
      <div className="bg-[#06040A] rounded-none p-2.5 border border-[#1C142E] space-y-1.5 font-mono text-[11px]">
        <div className="flex justify-between items-center text-zinc-400">
          <span>Schedule:</span>
          <span className="font-bold text-zinc-100">Every {interval} {unit}</span>
        </div>
        <div className="flex justify-between items-center text-zinc-400">
          <span>Engine:</span>
          <span className="text-cyan-400">ReactVM System Block Tick</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-cyan-400/80 font-mono">
        <RefreshCw className="w-3 h-3" />
        <span>tickTimestamp, blockNumber</span>
      </div>
    </NodeCard>
  );
}

export const PeriodicCronNode = memo(PeriodicCronNodeComponent);
