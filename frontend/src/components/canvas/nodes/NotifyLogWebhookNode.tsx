'use client';

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { Bell } from 'lucide-react';
import { NodeCard } from './NodeCard';
import { NotifyLogWebhookData } from '@/types/canvas';

function NotifyLogWebhookNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as NotifyLogWebhookData;
  const alertTitle = nodeData.alertTitle || 'Volatile Event Detected';
  const severity = nodeData.severity || 'WARNING';

  const severityColor =
    severity === 'CRITICAL' ? 'text-rose-400' : severity === 'WARNING' ? 'text-amber-400' : 'text-sky-400';

  return (
    <NodeCard
      id={id}
      selected={selected}
      category="action"
      state={nodeData.state || 'IDLE'}
      title="Notify Log"
      subtitle="On-Chain Event Logger"
      icon={<Bell className="size-4" />}
      hasSourceHandle={false}
      hasTargetHandle={true}
    >
      <div className="flex items-center justify-between py-0.5">
        <span className="text-[11px] text-[var(--ws-muted)]">Title:</span>
        <span className="font-medium text-white truncate max-w-[150px] text-xs">{alertTitle}</span>
      </div>
      <div className="flex items-center justify-between py-0.5">
        <span className="text-[11px] text-[var(--ws-muted)]">Severity:</span>
        <span className={`font-semibold text-xs ${severityColor}`}>{severity}</span>
      </div>
    </NodeCard>
  );
}

export const NotifyLogWebhookNode = memo(NotifyLogWebhookNodeComponent);
