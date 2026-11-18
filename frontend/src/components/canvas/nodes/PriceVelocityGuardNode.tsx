'use client';

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { Activity, Clock } from 'lucide-react';
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
      title="Price Velocity Guard"
      subtitle="Node #14 • Anchored Window"
      icon={<Activity className="w-4 h-4 text-amber-400" />}
      hasSourceHandle={true}
      hasTargetHandle={true}
    >
      <div className="bg-[#07080d]/80 rounded-xl p-2.5 border border-white/[0.06] space-y-2 text-xs">
        <div className="flex justify-between items-center text-slate-400">
          <span>Velocity Drop:</span>
          <span className="font-mono text-rose-400 font-bold text-sm tabular-nums">
            &gt; {velocityPercent}%
          </span>
        </div>
        <div className="flex justify-between items-center text-slate-400">
          <span>Time Window:</span>
          <span className="font-mono text-amber-300 font-semibold text-xs tabular-nums">
            {windowSeconds} Seconds
          </span>
        </div>
        <div className="flex justify-between items-center text-slate-400">
          <span>Mode:</span>
          <span className="text-white font-mono text-[11px] font-medium">
            {direction === 'DROP' ? 'Rapid Flash Dump' : 'Rapid Spike'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-amber-400/80 font-mono">
        <Clock className="w-3.5 h-3.5" />
        <span>ΔPrice / Δt on Lasna RVM</span>
      </div>
    </NodeCard>
  );
}

export const PriceVelocityGuardNode = memo(PriceVelocityGuardNodeComponent);
