'use client';

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { GitMerge, Split } from 'lucide-react';
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
      subtitle="Zapier Multi-Signal Evaluator"
      icon={<GitMerge className="w-4 h-4 text-purple-400" />}
      hasSourceHandle={true}
      targetHandles={[
        { id: 'signal-a', label: 'Signal A', topPercent: 32 },
        { id: 'signal-b', label: 'Signal B', topPercent: 68 },
      ]}
    >
      <div className="bg-[#0D0819]/90 rounded-xl p-2.5 border border-[#2E1E54]/60 space-y-2 text-xs">
        <div className="flex justify-between items-center text-purple-300/70">
          <span>Operation:</span>
          <span className="font-semibold text-violet-300">
            {gateType === 'AND' ? 'Signal A AND Signal B' : 'Signal A OR Signal B'}
          </span>
        </div>
        <div className="flex justify-between items-center text-purple-300/70">
          <span>Inputs:</span>
          <span className="text-slate-300">2 In / 1 Out</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-violet-400/80 font-mono">
        <Split className="w-3.5 h-3.5" />
        <span>if (condA {gateType === 'AND' ? '&&' : '||'} condB) emit</span>
      </div>
    </NodeCard>
  );
}

export const LogicGateNode = memo(LogicGateNodeComponent);
