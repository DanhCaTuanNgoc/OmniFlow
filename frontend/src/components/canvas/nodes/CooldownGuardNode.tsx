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
      <div className="bg-[#06040A] rounded-none p-2.5 border border-[#1C142E] space-y-1.5 font-mono text-[11px]">
        <div className="flex justify-between items-center text-zinc-400">
          <span>Lock Interval:</span>
          <span className="font-bold text-zinc-100 tabular-nums">{cooldownSec}s ({Math.floor(cooldownSec / 60)} min)</span>
        </div>
        <div className="flex justify-between items-center text-zinc-400">
          <span>Defense Scope:</span>
          <span className="text-amber-400 font-bold">Base 200ms Block Flurry</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-amber-400/80 font-mono">
        <ShieldCheck className="w-3 h-3" />
        <span>now - lastTriggered &gt; cooldown</span>
      </div>
    </NodeCard>
  );
}

export const CooldownGuardNode = memo(CooldownGuardNodeComponent);
