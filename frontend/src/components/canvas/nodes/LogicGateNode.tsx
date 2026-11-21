'use client';

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { GitMerge } from 'lucide-react';
import { NodeCard } from './NodeCard';
import { LogicGateData } from '@/types/canvas';

function LogicGateNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as LogicGateData;
  const gateType = nodeData.gateType || 'AND';

  return (
    <NodeCard
      id={id}
      selected={selected}
      category="logic"
      state={nodeData.state || 'IDLE'}
      title={`Logic Gate (${gateType})`}
      subtitle="Multi-Signal Evaluator"
      icon={<GitMerge className="size-4" />}
      hasSourceHandle={true}
      targetHandles={[
        { id: 'signal-a', label: 'Signal A', topPercent: 32 },
        { id: 'signal-b', label: 'Signal B', topPercent: 68 },
      ]}
      warning={nodeData.warning}
      isOrphan={nodeData.isOrphan}
    >
      <div className="flex items-center justify-between py-0.5">
        <span className="text-[11px] text-[var(--ws-muted)]">Rule:</span>
        <span className="font-semibold text-purple-300 font-mono text-xs">
          {gateType === 'AND' ? 'Signal A AND Signal B' : 'Signal A OR Signal B'}
        </span>
      </div>
      <div className="flex items-center justify-between py-0.5">
        <span className="text-[11px] text-[var(--ws-muted)]">Ports:</span>
        <span className="text-xs text-zinc-300 font-mono">2 Inputs &rarr; 1 Output</span>
      </div>
    </NodeCard>
  );
}

export const LogicGateNode = memo(LogicGateNodeComponent);
