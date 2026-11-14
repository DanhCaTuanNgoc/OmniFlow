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
      <div className="bg-[#0D0819]/90 rounded-xl p-2.5 border border-[#2E1E54]/60 space-y-2 text-xs">
        <div className="flex justify-between items-center text-purple-300/70">
          <span>Lock Interval:</span>
          <span className="font-semibold text-white tabular-nums">{cooldownSec}s ({Math.floor(cooldownSec / 60)} min)</span>
        </div>
        <div className="flex justify-between items-center text-purple-300/70">
          <span>Defense Scope:</span>
          <span className="text-amber-300 font-medium">Base 200ms Storm Guard</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-amber-400/80 font-mono">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>now - lastTriggered &gt; cooldown</span>
      </div>
    </NodeCard>
  );
}

export const CooldownGuardNode = memo(CooldownGuardNodeComponent);
