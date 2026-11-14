'use client';

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { ArrowLeftRight, ShieldAlert } from 'lucide-react';
import { NodeCard } from './NodeCard';
import { WatchTransfersData } from '@/types/canvas';
import { truncateAddress } from '@/lib/utils';

function WatchTransfersNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as WatchTransfersData;
  const targetWallet = nodeData.targetWallet || 'Connected Wallet';
  const direction = nodeData.direction || 'Outgoing';

  return (
    <NodeCard
      id={id}
      selected={selected}
      category="trigger"
      state={nodeData.state || 'IDLE'}
      title="Watch Transfers"
      subtitle="ERC-20 / Native Flow"
      icon={<ArrowLeftRight className="w-4 h-4 text-cyan-400" />}
      hasSourceHandle={true}
      hasTargetHandle={false}
    >
      <div className="bg-[#06040A] rounded-none p-2.5 border border-[#1C142E] space-y-1.5 font-mono text-[11px]">
        <div className="flex justify-between items-center text-zinc-400">
          <span>Target:</span>
          <span className="font-bold text-zinc-100">{truncateAddress(targetWallet) || 'My Wallet'}</span>
        </div>
        <div className="flex justify-between items-center text-zinc-400">
          <span>Direction:</span>
          <span className="text-cyan-400 font-bold">{direction}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-cyan-400/80 font-mono">
        <ShieldAlert className="w-3 h-3" />
        <span>Transfer(from, to, value)</span>
      </div>
    </NodeCard>
  );
}

export const WatchTransfersNode = memo(WatchTransfersNodeComponent);
