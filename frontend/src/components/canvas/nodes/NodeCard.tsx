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

const CATEGORY_CONFIG: Record<NodeCategory, { 
  topBorder: string; 
  shadowGlow: string;
  badge: string; 
  text: string; 
  headerBg: string; 
  handleClass: string; 
}> = {
  trigger: {
    topBorder: 'border-t-2 border-t-cyan-400',
    shadowGlow: 'shadow-[0_4px_24px_-6px_rgba(34,211,238,0.25)]',
    badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/25',
    text: 'text-cyan-400',
    headerBg: 'bg-gradient-to-r from-cyan-950/20 via-transparent to-transparent',
    handleClass: '!border-cyan-400 hover:!bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]',
  },
  condition: {
    topBorder: 'border-t-2 border-t-amber-400',
    shadowGlow: 'shadow-[0_4px_24px_-6px_rgba(251,191,36,0.2)]',
    badge: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
    text: 'text-amber-400',
    headerBg: 'bg-gradient-to-r from-amber-950/20 via-transparent to-transparent',
    handleClass: '!border-amber-400 hover:!bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]',
  },
  action: {
    topBorder: 'border-t-2 border-t-emerald-400',
    shadowGlow: 'shadow-[0_4px_24px_-6px_rgba(52,211,153,0.25)]',
    badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
    text: 'text-emerald-400',
    headerBg: 'bg-gradient-to-r from-emerald-950/20 via-transparent to-transparent',
    handleClass: '!border-emerald-400 hover:!bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]',
  },
  logic: {
    topBorder: 'border-t-2 border-t-purple-400',
    shadowGlow: 'shadow-[0_4px_24px_-6px_rgba(168,85,247,0.25)]',
    badge: 'bg-purple-500/10 text-purple-300 border-purple-500/25',
    text: 'text-purple-400',
    headerBg: 'bg-gradient-to-r from-purple-950/20 via-transparent to-transparent',
    handleClass: '!border-purple-400 hover:!bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]',
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
    textClass: 'text-purple-300',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />,
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
    textClass: 'text-purple-300 font-bold',
    icon: <Zap className="w-3.5 h-3.5 text-purple-400 animate-pulse" />,
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
        'relative w-72 rounded-xl bg-[var(--ws-panel)] border border-[var(--ws-border)] select-none transition-[border-color,box-shadow,transform] duration-150 transform-gpu shadow-xl shadow-black/40',
        cat.topBorder,
        cat.shadowGlow,
        selected
          ? 'ring-2 ring-[var(--ws-accent)] border-[var(--ws-accent)]/60 scale-[1.01]'
          : 'hover:border-white/20'
      )}
    >
      {/* Target Handle(s) on Left - Glowing Micro-Dot with Precision Port */}
      {targetHandles ? (
        targetHandles.map((h, i) => (
          <Handle
            key={h.id}
            id={h.id}
            type="target"
            position={Position.Left}
            style={{ top: `${h.topPercent ?? (i === 0 ? 35 : 65)}%` }}
            className={cn(
              '!w-3.5 !h-3.5 !rounded-full !bg-[var(--ws-panel)] !border-2 transition-transform hover:!scale-130 cursor-crosshair',
              cat.handleClass
            )}
          />
        ))
      ) : hasTargetHandle ? (
        <Handle
          type="target"
          position={Position.Left}
          className={cn(
            '!w-3.5 !h-3.5 !rounded-full !bg-[var(--ws-panel)] !border-2 transition-transform hover:!scale-130 cursor-crosshair',
            cat.handleClass
          )}
        />
      ) : null}

      {/* Card Header */}
      <div className={cn('px-3.5 py-2.5 rounded-t-xl border-b border-[var(--ws-border)] flex items-center justify-between', cat.headerBg)}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-lg border border-white/[0.08] bg-black/40 shadow-sm shrink-0">
            {icon}
          </div>
          <div className="truncate">
            <h4 className="text-xs font-bold text-white tracking-tight truncate">{title}</h4>
            <p className="text-[11px] text-[var(--ws-muted)] truncate">{subtitle}</p>
          </div>
        </div>

        <span
          className={cn(
            'text-[9.5px] uppercase font-mono font-semibold px-2 py-0.5 rounded-md border tracking-wider ml-2 shrink-0',
            cat.badge
          )}
        >
          {category}
        </span>
      </div>

      {/* Card Body / Custom Details */}
      {children && (
        <div className="p-3 text-xs text-zinc-200 space-y-2">
          {children}
        </div>
      )}

      {/* Card Footer: Visual State Indicator with Soft Glow Dot */}
      <div className="px-3.5 py-2 border-t border-[var(--ws-border)] bg-black/25 rounded-b-xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className={cn('status-dot', st.dotClass)} />
          <span className={cn('font-medium text-[11px]', st.textClass)}>
            {st.label}
          </span>
        </div>
        <span className="text-[10px] text-[var(--ws-muted)] font-mono uppercase tracking-wider">
          {category === 'trigger' ? 'Out Stream' : category === 'action' ? 'Callback End' : 'In / Out'}
        </span>
      </div>

      {/* Source Handle on Right - Glowing Micro-Dot with Precision Port */}
      {hasSourceHandle && (
        <Handle
          type="source"
          position={Position.Right}
          className={cn(
            '!w-3.5 !h-3.5 !rounded-full !bg-[var(--ws-panel)] !border-2 transition-transform hover:!scale-130 cursor-crosshair',
            cat.handleClass
          )}
        />
      )}
    </div>
  );
}
