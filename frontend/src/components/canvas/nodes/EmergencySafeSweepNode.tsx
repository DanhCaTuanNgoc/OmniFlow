'use client';

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { ShieldCheck, Flame } from 'lucide-react';
import { NodeCard } from './NodeCard';
import { EmergencySafeSweepData } from '@/types/canvas';
import { truncateAddress } from '@/lib/utils';

function EmergencySafeSweepNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as EmergencySafeSweepData;
  const safeAddress = nodeData.safeAddress || '0xColdWalletAddress';
  const assetScope = nodeData.assetScope || 'ALL';

  return (
    <NodeCard
      id={id}
      selected={selected}
      category="action"
      state={nodeData.state || 'IDLE'}
      title="Emergency SafeSweep"
      subtitle="Anti-Drainer Cold Vault Evac"
      icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
      hasSourceHandle={false}
      hasTargetHandle={true}
    >
      <div className="bg-[#06040A] rounded-none p-2.5 border border-[#1C142E] space-y-1.5 font-mono text-[11px]">
        <div className="flex justify-between items-center text-zinc-400">
          <span>Safe Destination:</span>
          <span className="font-bold text-zinc-100">{truncateAddress(safeAddress)}</span>
        </div>
        <div className="flex justify-between items-center text-zinc-400">
          <span>Scope:</span>
          <span className="text-emerald-400 font-bold">{assetScope === 'ALL' ? '100% ETH + ERC20' : 'ETH Only'}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-emerald-400/80 font-mono">
        <Flame className="w-3 h-3 text-orange-400" />
        <span>vault.executeSafeSweep(backupSafe)</span>
      </div>
    </NodeCard>
  );
}

export const EmergencySafeSweepNode = memo(EmergencySafeSweepNodeComponent);
