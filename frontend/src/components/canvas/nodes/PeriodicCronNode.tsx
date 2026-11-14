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
      <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 space-y-1.5">
        <div className="flex justify-between items-center text-slate-400">
          <span>Schedule:</span>
          <span className="font-semibold text-slate-100">Every {interval} {unit}</span>
        </div>
        <div className="flex justify-between items-center text-slate-400">
          <span>Engine:</span>
          <span className="text-cyan-400 font-mono">ReactVM System Block Tick</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-cyan-400/80">
        <RefreshCw className="w-3.5 h-3.5" />
        <span>tickTimestamp, blockNumber</span>
      </div>
    </NodeCard>
  );
}

export const PeriodicCronNode = memo(PeriodicCronNodeComponent);
