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
      <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 space-y-1.5">
        <div className="flex justify-between items-center text-slate-400">
          <span>Target:</span>
          <span className="font-mono text-slate-100">{truncateAddress(targetWallet) || 'My Wallet'}</span>
        </div>
        <div className="flex justify-between items-center text-slate-400">
          <span>Direction:</span>
          <span className="text-cyan-400 font-medium">{direction}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-cyan-400/80">
        <ShieldAlert className="w-3.5 h-3.5" />
        <span>Transfer(from, to, value)</span>
      </div>
    </NodeCard>
  );
}

export const WatchTransfersNode = memo(WatchTransfersNodeComponent);
