'use client';

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { Target, AlertTriangle } from 'lucide-react';
import { NodeCard } from './NodeCard';
import { PriceThresholdGuardData } from '@/types/canvas';
import { formatUSD } from '@/lib/utils';

function PriceThresholdGuardNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as PriceThresholdGuardData;
  const operator = nodeData.operator || 'LESS_THAN_OR_EQUAL';
  const thresholdPrice = nodeData.thresholdPriceUSD || 1800;
  const isStopLoss = operator === 'LESS_THAN_OR_EQUAL';

  return (
    <NodeCard
      id={id}
      selected={selected}
      category="condition"
      state={nodeData.state || 'CONFIGURED'}
      title="Price Threshold Guard"
      subtitle={isStopLoss ? 'Stop-Loss Guard' : 'Take-Profit Guard'}
      icon={<Target className="w-4 h-4 text-amber-400" />}
      hasSourceHandle={true}
      hasTargetHandle={true}
    >
      <div className="bg-[#07080d]/80 rounded-xl p-2.5 border border-white/[0.06] space-y-2 text-xs">
        <div className="flex justify-between items-center text-slate-400">
          <span>Condition:</span>
          <span className="font-semibold text-amber-300">
            Price {isStopLoss ? '<=' : '>='}
          </span>
        </div>
        <div className="flex justify-between items-center text-slate-400">
          <span>Trigger Price:</span>
          <span className="text-sm font-bold text-white font-mono tabular-nums">
            {formatUSD(thresholdPrice)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-amber-400/80 font-mono">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>reserve1 * 1e18 / reserve0</span>
      </div>
    </NodeCard>
  );
}

export const PriceThresholdGuardNode = memo(PriceThresholdGuardNodeComponent);
