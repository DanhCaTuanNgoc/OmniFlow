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
      <div className="bg-[#07080d]/80 rounded-xl p-2.5 border border-white/[0.06] space-y-2 text-xs">
        <div className="flex justify-between items-center text-purple-300/70">
          <span>Alert Title:</span>
          <span className="font-semibold text-white truncate max-w-[140px]">{alertTitle}</span>
        </div>
        <div className="flex justify-between items-center text-purple-300/70">
          <span>Severity:</span>
          <span className={`font-semibold ${severityColor}`}>{severity}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-emerald-400/80 font-mono">
        <Terminal className="w-3.5 h-3.5" />
        <span>emit PipelineNotification(msg)</span>
      </div>
    </NodeCard>
  );
}

export const NotifyLogWebhookNode = memo(NotifyLogWebhookNodeComponent);
