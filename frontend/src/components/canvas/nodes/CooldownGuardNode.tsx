'use client';

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { Hourglass } from 'lucide-react';
import { NodeCard } from './NodeCard';
import { CooldownGuardData } from '@/types/canvas';

function CooldownGuardNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as CooldownGuardData;
  const cooldownSec = nodeData.cooldownSeconds ?? 300;

  return (
    <NodeCard
      id={id}
      selected={selected}
      category="condition"
      state={nodeData.state || 'CONFIGURED'}
      title="Cooldown Limiter"
      subtitle="Storm Prevention Guard"
      icon={<Hourglass className="size-4" />}
      hasSourceHandle={true}
      hasTargetHandle={true}
      warning={nodeData.warning}
      isOrphan={nodeData.isOrphan}
    >
      <div className="flex items-center justify-between py-0.5">
        <span className="text-[11px] text-[var(--ws-muted)]">Interval:</span>
        <span className="text-xs font-semibold text-white font-mono tabular-nums">{cooldownSec}s ({Math.floor(cooldownSec / 60)} min)</span>
      </div>
      <div className="flex items-center justify-between py-0.5">
        <span className="text-[11px] text-[var(--ws-muted)]">Scope:</span>
        <span className="text-xs text-amber-300 font-medium">Base 200ms Denim Blocks</span>
      </div>
    </NodeCard>
  );
}

export const CooldownGuardNode = memo(CooldownGuardNodeComponent);
