'use client';

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { ArrowDownRight } from 'lucide-react';
import { NodeCard } from './NodeCard';
import { DEXSwapData } from '@/types/canvas';
import { STOP_LOSS_TEMPLATE } from '@omniflow/shared';

function DEXSwapNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as DEXSwapData;
  const fromToken = nodeData.fromToken || 'ETH';
  const toToken = nodeData.toToken || 'USDC';
  const percent = nodeData.amountPercentage || 50;
  const slippage = nodeData.maxSlippagePercent ?? STOP_LOSS_TEMPLATE.maxSlippageBps / 100;

  return (
    <NodeCard
      id={id}
      selected={selected}
      category="action"
      state={nodeData.state || 'CONFIGURED'}
      title="DEX Token Swap"
      subtitle="ActionVault Execution"
      icon={<ArrowDownRight className="size-4" />}
      hasSourceHandle={false}
      hasTargetHandle={true}
    >
      <div className="flex items-center justify-between py-0.5">
        <span className="text-[11px] text-[var(--ws-muted)]">Action:</span>
        <span className="font-semibold text-emerald-300 font-mono text-xs">Swap {fromToken} &rarr; {toToken}</span>
      </div>
      <div className="flex items-center justify-between py-0.5">
        <span className="text-[11px] text-[var(--ws-muted)]">Vault Allocation:</span>
        <span className="text-xs font-semibold text-white font-mono tabular-nums">{percent}% of Vault</span>
      </div>
      <div className="flex items-center justify-between py-0.5">
        <span className="text-[11px] text-[var(--ws-muted)]">Max Slippage:</span>
        <span className="text-xs text-zinc-300 font-mono tabular-nums">{slippage}%</span>
      </div>
    </NodeCard>
  );
}

export const DEXSwapNode = memo(DEXSwapNodeComponent);
