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
      <div className="bg-[#06040A] rounded-none p-2.5 border border-[#1C142E] space-y-1.5 font-mono text-[11px]">
        <div className="flex justify-between items-center text-zinc-400">
          <span>Operation:</span>
          <span className="font-bold text-[#C084FC]">
            {gateType === 'AND' ? 'Signal A AND Signal B' : 'Signal A OR Signal B'}
          </span>
        </div>
        <div className="flex justify-between items-center text-zinc-400">
          <span>Inputs:</span>
          <span className="text-zinc-200">2 Port In / 1 Port Out</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-[#C084FC]/80 font-mono">
        <Split className="w-3 h-3" />
        <span>if (condA {gateType === 'AND' ? '&&' : '||'} condB) emit</span>
      </div>
    </NodeCard>
  );
}

export const LogicGateNode = memo(LogicGateNodeComponent);
