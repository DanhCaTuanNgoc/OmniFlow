'use client';

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { Radio } from 'lucide-react';
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
      title="Event Watcher"
      subtitle="Contract Event Listener"
      icon={<Radio className="size-4" />}
      hasSourceHandle={true}
      hasTargetHandle={false}
    >
      <div className="flex items-center justify-between py-0.5">
        <span className="text-[11px] text-[var(--ws-muted)]">Contract:</span>
        <span className="font-mono text-white font-medium text-xs">
          {contractAddress ? truncateAddress(contractAddress, 6) : 'Any Address'}
        </span>
      </div>
      <div className="flex items-center justify-between py-0.5">
        <span className="text-[11px] text-[var(--ws-muted)]">Event:</span>
        <span className="text-xs text-sky-400 font-mono truncate max-w-[140px]" title={eventName}>
          {eventName}
        </span>
      </div>
      <div className="flex items-center justify-between py-0.5">
        <span className="text-[11px] text-[var(--ws-muted)]">Chain:</span>
        <span className={`font-mono text-[11px] font-medium ${isCrossChain ? 'text-purple-400' : 'text-sky-400'}`}>
          {chainLabel}
        </span>
      </div>
    </NodeCard>
  );
}

export const CustomEventWatcherNode = memo(CustomEventWatcherNodeComponent);
