'use client';

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { Bell, Terminal } from 'lucide-react';
import { NodeCard } from './NodeCard';
import { NotifyLogWebhookData } from '@/types/canvas';

function NotifyLogWebhookNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as NotifyLogWebhookData;
  const alertTitle = nodeData.alertTitle || 'Volatile Event Detected';
  const severity = nodeData.severity || 'WARNING';

  const severityColor =
    severity === 'CRITICAL' ? 'text-red-400' : severity === 'WARNING' ? 'text-amber-400' : 'text-blue-400';

  return (
    <NodeCard
      id={id}
      selected={selected}
      category="action"
      state={nodeData.state || 'IDLE'}
      title="Notify Log Webhook"
      subtitle="Zero-Gas On-Chain Event"
      icon={<Bell className="w-4 h-4 text-emerald-400" />}
      hasSourceHandle={false}
      hasTargetHandle={true}
    >
      <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 space-y-1.5">
        <div className="flex justify-between items-center text-slate-400">
          <span>Alert Title:</span>
          <span className="font-semibold text-slate-100 truncate max-w-[140px]">{alertTitle}</span>
        </div>
        <div className="flex justify-between items-center text-slate-400">
          <span>Severity:</span>
          <span className={`font-mono font-bold ${severityColor}`}>{severity}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-emerald-400/80">
        <Terminal className="w-3.5 h-3.5" />
        <span>emit PipelineNotification(msg)</span>
      </div>
    </NodeCard>
  );
}

export const NotifyLogWebhookNode = memo(NotifyLogWebhookNodeComponent);
