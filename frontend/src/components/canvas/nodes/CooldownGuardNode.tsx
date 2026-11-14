'use client';

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { Hourglass, ShieldCheck } from 'lucide-react';
import { NodeCard } from './NodeCard';
import { CooldownGuardData } from '@/types/canvas';

function CooldownGuardNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as CooldownGuardData;
  const cooldownSec = nodeData.cooldownSeconds || 300;

  return (
    <NodeCard
      id={id}
      selected={selected}
      category="condition"
      state={nodeData.state || 'CONFIGURED'}
      title="Cooldown Rate-Limiter"
      subtitle="Multi-Callback Storm Guard"
      icon={<Hourglass className="w-4 h-4 text-amber-400" />}
      hasSourceHandle={true}
      hasTargetHandle={true}
    >
      <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 space-y-1.5">
        <div className="flex justify-between items-center text-slate-400">
          <span>Lock Interval:</span>
          <span className="font-bold text-slate-100 tabular-nums">{cooldownSec}s ({Math.floor(cooldownSec / 60)} min)</span>
        </div>
        <div className="flex justify-between items-center text-slate-400">
          <span>Defense Scope:</span>
          <span className="text-amber-400 font-medium">Base 200ms Block Flurry</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-amber-400/80">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>now - lastTriggered &gt; cooldown</span>
      </div>
    </NodeCard>
  );
}

export const CooldownGuardNode = memo(CooldownGuardNodeComponent);
