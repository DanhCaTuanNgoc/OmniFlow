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

const CATEGORY_CONFIG: Record<NodeCategory, { border: string; badge: string; text: string; headerBg: string; handleColor: string }> = {
  trigger: {
    border: 'border-cyan-500/30 hover:border-cyan-400/50',
    badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
    text: 'text-cyan-400',
    headerBg: 'bg-gradient-to-r from-cyan-950/30 via-[#150E28] to-[#110B1F]',
    handleColor: '!border-cyan-400 hover:!bg-cyan-400',
  },
  condition: {
    border: 'border-amber-500/30 hover:border-amber-400/50',
    badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    text: 'text-amber-400',
    headerBg: 'bg-gradient-to-r from-amber-950/30 via-[#150E28] to-[#110B1F]',
    handleColor: '!border-amber-400 hover:!bg-amber-400',
  },
  action: {
    border: 'border-emerald-500/30 hover:border-emerald-400/50',
    badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    text: 'text-emerald-400',
    headerBg: 'bg-gradient-to-r from-emerald-950/30 via-[#150E28] to-[#110B1F]',
    handleColor: '!border-emerald-400 hover:!bg-emerald-400',
  },
  logic: {
    border: 'border-violet-500/30 hover:border-violet-400/50',
    badge: 'bg-violet-500/10 text-violet-300 border-violet-500/30',
    text: 'text-violet-400',
    headerBg: 'bg-gradient-to-r from-purple-950/40 via-[#150E28] to-[#110B1F]',
    handleColor: '!border-violet-400 hover:!bg-violet-400',
  },
};

const STATE_CONFIG: Record<VisualNodeState, { label: string; dotClass: string; textClass: string; icon: React.ReactNode }> = {
  IDLE: {
    label: 'Ready',
    dotClass: 'bg-slate-500',
    textClass: 'text-slate-400',
    icon: <Settings2 className="w-3.5 h-3.5 text-slate-400" />,
  },
  CONFIGURED: {
    label: 'Configured',
    dotClass: 'status-dot-violet',
    textClass: 'text-violet-300',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-violet-400" />,
  },
  LISTENING: {
    label: 'Listening',
    dotClass: 'status-dot-cyan animate-pulse',
    textClass: 'text-cyan-300 font-semibold',
    icon: <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />,
  },
  EVENT_CAPTURED: {
    label: 'Event Captured',
    dotClass: 'status-dot-cyan',
    textClass: 'text-cyan-200 font-bold',
    icon: <Sparkles className="w-3.5 h-3.5 text-cyan-300" />,
  },
  EVALUATING: {
    label: 'Evaluating',
    dotClass: 'status-dot-amber',
    textClass: 'text-amber-300',
    icon: <Activity className="w-3.5 h-3.5 text-amber-400 animate-spin" />,
  },
  CONDITION_MET: {
    label: 'Trigger Met',
    dotClass: 'status-dot-amber',
    textClass: 'text-amber-200 font-bold',
    icon: <Zap className="w-3.5 h-3.5 text-amber-400" />,
  },
  FIRING_CALLBACK: {
    label: 'Callback Firing',
    dotClass: 'status-dot-violet',
    textClass: 'text-violet-300 font-bold',
    icon: <Zap className="w-3.5 h-3.5 text-violet-400 animate-pulse" />,
  },
  SUCCESS: {
    label: 'Executed',
    dotClass: 'status-dot-emerald',
    textClass: 'text-emerald-300 font-bold',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
  },
  COOLDOWN: {
    label: 'Cooldown Active',
    dotClass: 'status-dot-amber',
    textClass: 'text-amber-300',
    icon: <Hourglass className="w-3.5 h-3.5 text-amber-400 animate-spin" />,
  },
  REVERTED: {
    label: 'Reverted',
    dotClass: 'status-dot-rose',
    textClass: 'text-rose-300 font-bold',
    icon: <AlertCircle className="w-3.5 h-3.5 text-rose-400" />,
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
  const cat = CATEGORY_CONFIG[category];
  const st = STATE_CONFIG[state];

  return (
    <div
      className={cn(
        'relative w-72 rounded-2xl bg-[#110B1F]/95 backdrop-blur-xl border select-none transition-all duration-200 shadow-xl shadow-black/40',
        cat.border,
        selected
          ? 'ring-2 ring-violet-500 border-violet-500 shadow-glow-violet scale-[1.01]'
          : 'hover:shadow-2xl hover:shadow-purple-950/30'
      )}
    >
      {/* Target Handle(s) on Left - Round Circular Precision Styled */}
      {targetHandles ? (
        targetHandles.map((h, i) => (
          <Handle
            key={h.id}
            id={h.id}
            type="target"
            position={Position.Left}
            style={{ top: `${h.topPercent ?? (i === 0 ? 35 : 65)}%` }}
            className={cn(
              '!w-3.5 !h-3.5 !rounded-full !bg-[#0D0819] !border-2 !border-purple-400 hover:!scale-125 transition-all shadow-md',
              cat.handleColor
            )}
          />
        ))
      ) : hasTargetHandle ? (
        <Handle
          type="target"
          position={Position.Left}
          className={cn(
            '!w-3.5 !h-3.5 !rounded-full !bg-[#0D0819] !border-2 !border-purple-400 hover:!scale-125 transition-all shadow-md',
            cat.handleColor
          )}
        />
      ) : null}

      {/* Card Header */}
      <div className={cn('px-4 py-3 rounded-t-2xl border-b border-purple-900/30 flex items-center justify-between', cat.headerBg)}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl border border-purple-900/40 bg-[#0D0819]/90 shadow-sm shrink-0">
            {icon}
          </div>
          <div className="truncate">
            <h4 className="text-xs font-bold text-white tracking-tight truncate">{title}</h4>
            <p className="text-[11px] text-purple-300/70 truncate">{subtitle}</p>
          </div>
        </div>

        <span
          className={cn(
            'text-[10px] capitalize font-medium px-2 py-0.5 rounded-full border tracking-wide ml-2 shrink-0',
            cat.badge
          )}
        >
          {category}
        </span>
      </div>

      {/* Card Body / Custom Details */}
      {children && (
        <div className="p-3 text-xs text-slate-200 space-y-2.5">
          {children}
        </div>
      )}

      {/* Card Footer: Visual State Indicator with Soft Glow Dot */}
      <div className="px-3.5 py-2 border-t border-purple-900/30 bg-[#0D0819]/80 rounded-b-2xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className={cn('status-dot', st.dotClass)} />
          <span className={cn('font-medium text-[11px]', st.textClass)}>
            {st.label}
          </span>
        </div>
        <span className="text-[10px] text-purple-400/60 font-mono">
          {category === 'trigger' ? 'Out Stream' : category === 'action' ? 'Vault Callback' : 'Condition'}
        </span>
      </div>

      {/* Source Handle on Right - Round Circular Precision Styled */}
      {hasSourceHandle && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3.5 !h-3.5 !rounded-full !bg-[#0D0819] !border-2 !border-violet-400 hover:!scale-125 transition-all shadow-md hover:!bg-violet-400"
        />
      )}
    </div>
  );
}
