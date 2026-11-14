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

const CATEGORY_CONFIG: Record<NodeCategory, { border: string; badge: string; text: string; accentClass: string }> = {
  trigger: {
    border: 'border-[#00E5FF]/40',
    badge: 'bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/30',
    text: 'text-[#00E5FF]',
    accentClass: 'tech-corner-accent-cyan',
  },
  condition: {
    border: 'border-[#F59E0B]/40',
    badge: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30',
    text: 'text-[#F59E0B]',
    accentClass: 'tech-corner-accent-amber',
  },
  action: {
    border: 'border-[#00FF9D]/40',
    badge: 'bg-[#00FF9D]/10 text-[#00FF9D] border-[#00FF9D]/30',
    text: 'text-[#00FF9D]',
    accentClass: 'tech-corner-accent-emerald',
  },
  logic: {
    border: 'border-[#8B5CF6]/40',
    badge: 'bg-[#8B5CF6]/10 text-[#C084FC] border-[#8B5CF6]/30',
    text: 'text-[#C084FC]',
    accentClass: 'tech-corner-accent',
  },
};

const STATE_CONFIG: Record<VisualNodeState, { label: string; pipClass: string; textClass: string; icon: React.ReactNode }> = {
  IDLE: {
    label: 'READY',
    pipClass: 'bg-zinc-600',
    textClass: 'text-zinc-400',
    icon: <Settings2 className="w-3 h-3 text-zinc-500" />,
  },
  CONFIGURED: {
    label: 'CONFIGURED',
    pipClass: 'status-pip-violet',
    textClass: 'text-[#C084FC]',
    icon: <CheckCircle2 className="w-3 h-3 text-[#C084FC]" />,
  },
  LISTENING: {
    label: 'LISTENING',
    pipClass: 'status-pip-cyan',
    textClass: 'text-cyan-400',
    icon: <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />,
  },
  EVENT_CAPTURED: {
    label: 'CAPTURED',
    pipClass: 'status-pip-cyan',
    textClass: 'text-cyan-300 font-bold',
    icon: <Sparkles className="w-3 h-3 text-cyan-300" />,
  },
  EVALUATING: {
    label: 'EVALUATING',
    pipClass: 'status-pip-amber',
    textClass: 'text-amber-400',
    icon: <Activity className="w-3 h-3 text-amber-400 animate-spin" />,
  },
  CONDITION_MET: {
    label: 'TRIGGER MET',
    pipClass: 'status-pip-amber',
    textClass: 'text-amber-300 font-bold',
    icon: <Zap className="w-3 h-3 text-amber-300" />,
  },
  FIRING_CALLBACK: {
    label: 'CALLBACK FIRING',
    pipClass: 'status-pip-violet',
    textClass: 'text-[#C084FC] font-bold',
    icon: <Zap className="w-3 h-3 text-[#8B5CF6] animate-pulse" />,
  },
  SUCCESS: {
    label: 'EXECUTED',
    pipClass: 'status-pip-emerald',
    textClass: 'text-emerald-400 font-bold',
    icon: <CheckCircle2 className="w-3 h-3 text-emerald-400" />,
  },
  COOLDOWN: {
    label: 'COOLDOWN ACTIVE',
    pipClass: 'status-pip-amber',
    textClass: 'text-amber-400',
    icon: <Hourglass className="w-3 h-3 text-amber-400 animate-spin" />,
  },
  REVERTED: {
    label: 'REVERTED',
    pipClass: 'status-pip-rose',
    textClass: 'text-rose-400 font-bold',
    icon: <AlertCircle className="w-3 h-3 text-rose-400" />,
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
        'tech-corner-accent relative w-72 rounded-none bg-[#0B0813] border select-none transition-all duration-150 shadow-xl font-mono',
        cat.accentClass,
        selected
          ? 'border-[#8B5CF6] shadow-lg shadow-[#8B5CF6]/20 ring-1 ring-[#8B5CF6]'
          : 'border-[#1C142E] hover:border-[#2E1F4A]'
      )}
    >
      {/* Target Handle(s) on Left - Square & Precision Styled */}
      {targetHandles ? (
        targetHandles.map((h, i) => (
          <Handle
            key={h.id}
            id={h.id}
            type="target"
            position={Position.Left}
            style={{ top: `${h.topPercent ?? (i === 0 ? 35 : 65)}%` }}
            className="!w-2.5 !h-2.5 !rounded-none !bg-[#06040A] !border !border-zinc-500 hover:!border-[#00E5FF] hover:!bg-[#00E5FF] transition-colors"
          />
        ))
      ) : hasTargetHandle ? (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-2.5 !h-2.5 !rounded-none !bg-[#06040A] !border !border-zinc-500 hover:!border-[#00E5FF] hover:!bg-[#00E5FF] transition-colors"
        />
      ) : null}

      {/* Card Header */}
      <div className="px-3.5 py-2.5 border-b border-[#1C142E] bg-[#0E0919] flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn('p-1.5 rounded-none border bg-[#06040A]', cat.border)}>
            {icon}
          </div>
          <div className="truncate">
            <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-wide truncate">{title}</h4>
            <p className="text-[10px] text-zinc-500 truncate">{subtitle}</p>
          </div>
        </div>

        <span
          className={cn(
            'text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded-none border tracking-wider ml-2 shrink-0',
            cat.badge
          )}
        >
          {category}
        </span>
      </div>

      {/* Card Body / Custom Details */}
      {children && (
        <div className="p-3 text-xs text-zinc-300 space-y-2 bg-[#0B0813]">
          {children}
        </div>
      )}

      {/* Card Footer: Visual State Indicator with Square Status Pip */}
      <div className="px-3 py-1.5 border-t border-[#1C142E] bg-[#06040A] flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-2">
          <span className={cn('status-pip', st.pipClass)} />
          <span className={cn('font-bold tracking-wider uppercase', st.textClass)}>
            {st.label}
          </span>
        </div>
        <span className="text-[9px] text-zinc-600 uppercase tracking-widest">
          {category === 'trigger' ? 'OUTSTREAM' : category === 'action' ? 'CALLBACK' : 'IN / OUT'}
        </span>
      </div>

      {/* Source Handle on Right - Square & Precision Styled */}
      {hasSourceHandle && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-2.5 !h-2.5 !rounded-none !bg-[#06040A] !border !border-[#8B5CF6] hover:!border-[#00FF9D] hover:!bg-[#00FF9D] transition-colors"
        />
      )}
    </div>
  );
}
