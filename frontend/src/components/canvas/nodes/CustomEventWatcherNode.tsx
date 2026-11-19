'use client';

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { Radio, Hash } from 'lucide-react';
import { NodeCard } from './NodeCard';
import { CustomEventWatcherData } from '@/types/canvas';
import { truncateAddress } from '@/lib/utils';

function CustomEventWatcherNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as CustomEventWatcherData;
  const contractAddress = nodeData.contractAddress;
  const eventName = nodeData.eventName || 'Transfer(address,address,uint256)';
  const chainId = nodeData.chainId || 84532;
  const chainLabel = chainId === 1301 ? 'Unichain Sepolia (1301)' : 'Base Sepolia (84532)';
  const isCrossChain = chainId === 1301;

  return (
    <NodeCard
      id={id}
      selected={selected}
      category="trigger"
      state={nodeData.state || 'LISTENING'}
      title="Custom Event Watcher"
      subtitle="Node #11 • Raw Topic Listener"
      icon={<Radio className="w-4 h-4 text-cyan-400" />}
      hasSourceHandle={true}
      hasTargetHandle={false}
    >
      <div className="bg-[#07080d]/80 rounded-xl p-2.5 border border-white/[0.06] space-y-2 text-xs">
        <div className="flex justify-between items-center text-slate-400">
          <span>Target Contract:</span>
          <span className="font-mono text-white font-medium text-[11px]">
            {contractAddress ? truncateAddress(contractAddress, 6) : '?'}
          </span>
        </div>
        <div className="flex justify-between items-center text-slate-400">
          <span>Event Signature:</span>
          <span className="text-cyan-300 font-semibold font-mono text-[11px] truncate max-w-[130px]" title={eventName}>
            {eventName}
          </span>
        </div>
        <div className="flex justify-between items-center text-slate-400">
          <span>Origin Chain:</span>
          <span className={`font-mono text-[11px] font-medium ${isCrossChain ? 'text-purple-400' : 'text-emerald-400'}`}>
            {chainLabel}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-cyan-400/80 font-mono">
        <Hash className="w-3.5 h-3.5" />
        <span className="truncate">topic0: {nodeData.topic0 ? truncateAddress(nodeData.topic0, 6) : 'Auto-computed'}</span>
      </div>
    </NodeCard>
  );
}

export const CustomEventWatcherNode = memo(CustomEventWatcherNodeComponent);
