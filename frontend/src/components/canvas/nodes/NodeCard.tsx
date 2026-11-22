'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { VisualNodeState, NodeCategory } from '@/types/canvas';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  warning?: string | null;
  isOrphan?: boolean;
}

const CATEGORY_THEME: Record<NodeCategory, {
  accentBorder: string;
  badge: string;
  iconBg: string;
  iconColor: string;
  handleBorder: string;
  label: string;
}> = {
  trigger: {
    accentBorder: 'border-l-[3px] border-l-sky-400',
    badge: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    iconBg: 'bg-sky-500/10',
    iconColor: 'text-sky-400',
    handleBorder: '!border-sky-400',
    label: 'Trigger',
  },
  condition: {
    accentBorder: 'border-l-[3px] border-l-amber-400',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
    handleBorder: '!border-amber-400',
    label: 'Condition',
  },
  action: {
    accentBorder: 'border-l-[3px] border-l-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    handleBorder: '!border-emerald-400',
    label: 'Action',
  },
  logic: {
    accentBorder: 'border-l-[3px] border-l-purple-400',
    badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-400',
    handleBorder: '!border-purple-400',
    label: 'Logic',
  },
};

const STATE_CONFIG: Record<VisualNodeState, { label: string; dot: string; text: string }> = {
  IDLE: {
    label: 'Ready',
    dot: 'bg-zinc-500',
    text: 'text-zinc-400',
  },
  CONFIGURED: {
    label: 'Configured',
    dot: 'bg-[var(--ws-accent)]',
    text: 'text-[var(--ws-accent)]',
  },
  CHECKING: {
    label: 'Current step',
    dot: 'bg-[var(--ws-accent)]',
    text: 'text-[var(--ws-accent)] font-medium',
  },
  LISTENING: {
    label: 'Listening',
    dot: 'bg-sky-400',
    text: 'text-sky-400 font-medium',
  },
  EVENT_CAPTURED: {
    label: 'Event Captured',
    dot: 'bg-sky-300',
    text: 'text-sky-300 font-medium',
  },
  EVALUATING: {
    label: 'Evaluating',
    dot: 'bg-amber-400',
    text: 'text-amber-400',
  },
  CONDITION_MET: {
    label: 'Trigger Met',
    dot: 'bg-amber-400',
    text: 'text-amber-300 font-medium',
  },
  FIRING_CALLBACK: {
    label: 'Firing Callback',
    dot: 'bg-purple-400',
    text: 'text-purple-300 font-medium',
  },
  SUCCESS: {
    label: 'Executed',
    dot: 'bg-emerald-400',
    text: 'text-emerald-300 font-medium',
  },
  COOLDOWN: {
    label: 'Cooldown',
    dot: 'bg-amber-400',
    text: 'text-amber-300',
  },
  REVERTED: {
    label: 'Reverted',
    dot: 'bg-rose-400',
    text: 'text-rose-400 font-medium',
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
  warning = null,
  isOrphan = false,
}: NodeCardProps) {
  const cat = CATEGORY_THEME[category];
  const st = STATE_CONFIG[state] ?? STATE_CONFIG.IDLE;

  return (
    <div
      className={cn(
        'relative w-72 rounded-xl bg-[var(--ws-panel)] border select-none transition-all duration-150 shadow-lg shadow-black/30',
        cat.accentBorder,
        isOrphan || warning
          ? isOrphan
            ? 'border-amber-500/50 shadow-amber-500/10'
            : 'border-rose-500/50 shadow-rose-500/10'
          : selected || state === 'CHECKING'
          ? 'ring-2 ring-[var(--ws-accent)] border-transparent'
          : 'border-[var(--ws-border)] hover:border-white/20'
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
            className={cn(
              '!size-3 !rounded-full !bg-[var(--ws-rail)] !border-2 cursor-crosshair',
              cat.handleBorder
            )}
          />
        ))
      ) : hasTargetHandle ? (
        <Handle
          type="target"
          position={Position.Left}
          className={cn(
            '!size-3 !rounded-full !bg-[var(--ws-rail)] !border-2 cursor-crosshair',
            cat.handleBorder
          )}
        />
      ) : null}

      {/* Card Header */}
      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-b border-[var(--ws-border)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn('grid size-7 place-items-center rounded-lg shrink-0', cat.iconBg, cat.iconColor)}>
            {icon}
          </div>
          <div className="truncate">
            <h4 className="text-xs font-semibold text-white tracking-tight truncate leading-tight">{title}</h4>
            <p className="text-[11px] text-[var(--ws-muted)] truncate leading-tight mt-0.5">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isOrphan ? (
            <span
              className="inline-flex items-center gap-1 text-[9.5px] font-mono font-medium px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-300"
              title={warning ?? 'Node is disconnected from the pipeline'}
            >
              <AlertTriangle className="size-2.5 text-amber-400" />
              Unconnected
            </span>
          ) : warning ? (
            <span
              className="inline-flex items-center gap-1 text-[9.5px] font-mono font-medium px-1.5 py-0.5 rounded border border-rose-500/30 bg-rose-500/10 text-rose-300"
              title={warning}
            >
              <AlertCircle className="size-2.5 text-rose-400" />
              Incomplete
            </span>
          ) : null}
          <span
            className={cn(
              'text-[9.5px] uppercase font-mono font-semibold px-1.5 py-0.5 rounded border tracking-wider',
              cat.badge
            )}
          >
            {cat.label}
          </span>
        </div>
      </div>

      {/* Card Body */}
      {children && (
        <div className="px-3.5 py-2.5 space-y-1.5 text-xs">
          {children}
        </div>
      )}

      {/* Warning Alert Banner */}
      {warning && (
        <div className="px-3 py-1.5 bg-amber-500/10 border-t border-amber-500/20 text-[10.5px] text-amber-300 flex items-center gap-1.5 leading-snug">
          <AlertTriangle className="size-3 text-amber-400 shrink-0" />
          <span className="truncate">{warning}</span>
        </div>
      )}

      {/* Card Footer */}
      <div className="flex items-center justify-between px-3.5 py-2 border-t border-[var(--ws-border)] bg-black/10 rounded-b-xl text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className={cn('size-1.5 rounded-full shrink-0', st.dot)} />
          <span className={st.text}>{st.label}</span>
        </div>
        <span className="text-[10px] text-[var(--ws-muted)] font-mono">
          {category === 'trigger' ? 'Origin' : category === 'action' ? 'Callback' : 'Eval'}
        </span>
      </div>

      {/* Source Handle on Right */}
      {hasSourceHandle && (
        <Handle
          type="source"
          position={Position.Right}
          className={cn(
            '!size-3 !rounded-full !bg-[var(--ws-rail)] !border-2 cursor-crosshair',
            cat.handleBorder
          )}
        />
      )}
    </div>
  );
}
