'use client';

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { Target } from 'lucide-react';
import { NodeCard } from './NodeCard';
import { PriceThresholdGuardData } from '@/types/canvas';
import { formatUSD } from '@/lib/utils';

function PriceThresholdGuardNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as PriceThresholdGuardData;
  const operator = nodeData.operator || 'LESS_THAN_OR_EQUAL';
  const thresholdPrice = nodeData.thresholdPriceUSD ?? 1800;
  const isStopLoss = operator === 'LESS_THAN_OR_EQUAL';

  return (
    <NodeCard
      id={id}
      selected={selected}
      category="condition"
      state={nodeData.state || 'CONFIGURED'}
      title="Price Threshold"
      subtitle={isStopLoss ? 'Stop-Loss Evaluation' : 'Take-Profit Evaluation'}
      icon={<Target className="size-4" />}
      hasSourceHandle={true}
      hasTargetHandle={true}
    >
      <div className="flex items-center justify-between py-0.5">
        <span className="text-[11px] text-[var(--ws-muted)]">Rule:</span>
        <span className="text-xs font-semibold text-amber-300 font-mono">
          Price {isStopLoss ? '<=' : '>='}
        </span>
      </div>
      <div className="flex items-center justify-between py-0.5">
        <span className="text-[11px] text-[var(--ws-muted)]">Threshold Price:</span>
        <span className="text-xs font-bold text-white font-mono tabular-nums">
          {formatUSD(thresholdPrice)}
        </span>
      </div>
    </NodeCard>
  );
}

export const PriceThresholdGuardNode = memo(PriceThresholdGuardNodeComponent);
