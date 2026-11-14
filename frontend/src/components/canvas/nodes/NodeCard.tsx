'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { VisualNodeState, NodeCategory } from '@/types/canvas';
import { cn } from '@/lib/utils';
import { 
  Radio, 
  Activity, 
  Hourglass, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  Settings2,
  Sparkles
} from 'lucide-react';

interface NodeCardProps {
  id: string;
  selected?: boolean;
  category: NodeCategory;
  state?: VisualNodeState;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
  hasTargetHandle?: boolean;
  hasSourceHandle?: boolean;
  targetHandles?: { id: string; label: string; topPercent?: number }[];
}

const CATEGORY_COLORS: Record<NodeCategory, { border: string; badge: string; text: string; bg: string }> = {
  trigger: {
    border: 'border-cyan-500/40',
    badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    text: 'text-cyan-400',
    bg: 'from-cyan-950/20 to-slate-900',
  },
  condition: {
    border: 'border-amber-500/40',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    text: 'text-amber-400',
    bg: 'from-amber-950/20 to-slate-900',
  },
  action: {
    border: 'border-emerald-500/40',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    text: 'text-emerald-400',
    bg: 'from-emerald-950/20 to-slate-900',
  },
  logic: {
    border: 'border-purple-500/40',
    badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    text: 'text-purple-400',
    bg: 'from-purple-950/20 to-slate-900',
  },
};

const STATE_CONFIG: Record<VisualNodeState, { label: string; border: string; glow: string; icon: React.ReactNode }> = {
  IDLE: {
    label: 'Ready',
    border: 'border-slate-700',
    glow: '',
    icon: <Settings2 className="w-3 h-3 text-slate-400" />,
  },
  CONFIGURED: {
    label: 'Configured',
    border: 'border-blue-500',
    glow: 'shadow-blue-500/20',
    icon: <CheckCircle2 className="w-3 h-3 text-blue-400" />,
  },
  LISTENING: {
    label: 'Listening',
    border: 'border-cyan-400 animate-pulse',
    glow: 'shadow-cyan-500/30 shadow-lg',
    icon: <Radio className="w-3 h-3 text-cyan-400" />,
  },
  EVENT_CAPTURED: {
    label: 'Event Captured',
    border: 'border-cyan-300 ring-2 ring-cyan-400',
    glow: 'shadow-cyan-400/50 shadow-xl',
    icon: <Sparkles className="w-3 h-3 text-cyan-300" />,
  },
  EVALUATING: {
    label: 'Evaluating',
    border: 'border-amber-400',
    glow: 'shadow-amber-500/30',
    icon: <Activity className="w-3 h-3 text-amber-400 animate-spin" />,
  },
  CONDITION_MET: {
    label: 'Trigger Met',
    border: 'border-yellow-400 ring-2 ring-yellow-400',
    glow: 'shadow-yellow-400/50 shadow-xl',
    icon: <Zap className="w-3 h-3 text-yellow-400" />,
  },
  FIRING_CALLBACK: {
    label: 'Callback Firing',
    border: 'border-purple-400 ring-2 ring-purple-400',
    glow: 'shadow-purple-500/50 shadow-xl',
    icon: <Zap className="w-3 h-3 text-purple-400 animate-pulse" />,
  },
  SUCCESS: {
    label: 'Executed',
    border: 'border-emerald-400 ring-1 ring-emerald-400',
    glow: 'shadow-emerald-500/30',
    icon: <CheckCircle2 className="w-3 h-3 text-emerald-400" />,
  },
  COOLDOWN: {
    label: 'Cooldown Active',
    border: 'border-orange-500',
    glow: 'shadow-orange-500/30',
    icon: <Hourglass className="w-3 h-3 text-orange-400 animate-spin" />,
  },
  REVERTED: {
    label: 'Reverted',
    border: 'border-red-500 ring-2 ring-red-500',
    glow: 'shadow-red-500/40',
    icon: <AlertCircle className="w-3 h-3 text-red-400" />,
  },
};

export function NodeCard({
  category,
  state = 'IDLE',
  title,
  subtitle,
  icon,
  children,
  hasTargetHandle = false,
  hasSourceHandle = false,
  targetHandles,
  selected = false,
}: NodeCardProps) {
  const cat = CATEGORY_COLORS[category];
  const st = STATE_CONFIG[state];

  return (
    <div
      className={cn(
        'relative w-72 rounded-xl bg-gradient-to-b border backdrop-blur-md transition-all duration-200 select-none shadow-2xl',
        cat.bg,
        selected ? 'ring-2 ring-cyan-400 border-cyan-400 shadow-cyan-500/20' : st.border,
        st.glow
      )}
    >
      {/* Target Handle(s) on Left */}
      {targetHandles ? (
        targetHandles.map((h, i) => (
          <Handle
            key={h.id}
            id={h.id}
            type="target"
            position={Position.Left}
            style={{ top: `${h.topPercent ?? (i === 0 ? 35 : 65)}%` }}
            className="w-3.5 h-3.5 !bg-slate-400 border-2 border-slate-900 hover:!bg-cyan-400 transition-colors"
          />
        ))
      ) : hasTargetHandle ? (
        <Handle
          type="target"
          position={Position.Left}
          className="w-3.5 h-3.5 !bg-slate-400 border-2 border-slate-900 hover:!bg-cyan-400 transition-colors"
        />
      ) : null}

      {/* Card Header */}
      <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={cn('p-1.5 rounded-lg border bg-slate-900/80', cat.border)}>
            {icon}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100 tracking-tight">{title}</h4>
            <p className="text-[11px] text-slate-400">{subtitle}</p>
          </div>
        </div>

        <span
          className={cn(
            'text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full border',
            cat.badge
          )}
        >
          {category}
        </span>
      </div>

      {/* Card Body / Custom Details */}
      {children && <div className="p-3 text-xs text-slate-300 space-y-2">{children}</div>}

      {/* Card Footer: Visual State Indicator */}
      <div className="px-3 py-2 border-t border-slate-800/80 bg-slate-950/60 rounded-b-xl flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 font-medium">
          {st.icon}
          <span className="text-slate-300">{st.label}</span>
        </div>
        <span className="font-mono text-[10px] text-slate-500">
          {category === 'trigger' ? 'Out Stream' : category === 'action' ? 'Callback End' : 'In / Out'}
        </span>
      </div>

      {/* Source Handle on Right */}
      {hasSourceHandle && (
        <Handle
          type="source"
          position={Position.Right}
          className="w-3.5 h-3.5 !bg-cyan-400 border-2 border-slate-900 hover:!bg-cyan-300 transition-colors"
        />
      )}
    </div>
  );
}
