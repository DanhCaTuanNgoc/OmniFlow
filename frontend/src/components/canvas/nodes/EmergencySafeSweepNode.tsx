'use client';

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { ShieldCheck, Flame } from 'lucide-react';
import { NodeCard } from './NodeCard';
import { EmergencySafeSweepData } from '@/types/canvas';
import { truncateAddress } from '@/lib/utils';

function EmergencySafeSweepNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as EmergencySafeSweepData;
  const safeAddress = nodeData.safeAddress;
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
      <div className="bg-[#07080d]/80 rounded-xl p-2.5 border border-white/[0.06] space-y-2 text-xs">
        <div className="flex justify-between items-center text-slate-400">
          <span>Safe Backup:</span>
          <span className="font-mono text-white text-xs font-medium">{safeAddress ? truncateAddress(safeAddress) : '?'}</span>
        </div>
        <div className="flex justify-between items-center text-slate-400">
          <span>Evacuation Scope:</span>
          <span className="text-emerald-300 font-semibold">{assetScope === 'ALL' ? '100% ETH + ERC20' : 'ETH Only'}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-emerald-400/80 font-mono">
        <Flame className="w-3.5 h-3.5 text-orange-400" />
        <span>vault.executeSafeSweep(backupSafe)</span>
      </div>
    </NodeCard>
  );
}

export const EmergencySafeSweepNode = memo(EmergencySafeSweepNodeComponent);
