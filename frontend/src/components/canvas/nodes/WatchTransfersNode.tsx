'use client';

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { ArrowLeftRight } from 'lucide-react';
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
      subtitle="Wallet Transfer Stream"
      icon={<ArrowLeftRight className="size-4" />}
      hasSourceHandle={true}
      hasTargetHandle={false}
    >
      <div className="flex items-center justify-between py-0.5">
        <span className="text-[11px] text-[var(--ws-muted)]">Target:</span>
        <span className="font-mono text-white text-xs font-medium">{truncateAddress(targetWallet) || 'My Wallet'}</span>
      </div>
      <div className="flex items-center justify-between py-0.5">
        <span className="text-[11px] text-[var(--ws-muted)]">Direction:</span>
        <span className="text-xs font-semibold text-sky-400">{direction}</span>
      </div>
    </NodeCard>
  );
}

export const WatchTransfersNode = memo(WatchTransfersNodeComponent);
