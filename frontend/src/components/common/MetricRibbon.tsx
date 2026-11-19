'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface MetricItem {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  badge?: {
    text: string;
    tone?: 'good' | 'warn' | 'bad' | 'info' | 'neutral';
  };
}

interface MetricRibbonProps {
  items: MetricItem[];
  className?: string;
}

const TONE_CLASSES: Record<string, string> = {
  good: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
  warn: 'text-amber-400 border-amber-500/20 bg-amber-500/10',
  bad: 'text-rose-400 border-rose-500/20 bg-rose-500/10',
  info: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/10',
  neutral: 'text-slate-300 border-white/10 bg-white/[0.04]',
};

export function MetricRibbon({ items, className }: MetricRibbonProps) {
  return (
    <div
      className={cn(
        'w-full rounded-xl bg-[#090A0F] border border-white/[0.08] shadow-sm overflow-hidden select-none',
        className
      )}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/[0.06]">
        {items.map((item, idx) => (
          <div key={idx} className="p-3.5 px-4 flex flex-col justify-between gap-1.5 min-w-0">
            <div className="flex items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-wider text-slate-400">
              <span className="truncate">{item.label}</span>
              {item.badge && (
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded-full border text-[9px] font-medium shrink-0',
                    TONE_CLASSES[item.badge.tone || 'neutral']
                  )}
                >
                  {item.badge.text}
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-lg font-semibold text-white tracking-tight tabular-nums truncate">
                {item.value}
              </span>
              {item.hint && (
                <span className="text-xs text-slate-400 font-normal truncate">
                  {item.hint}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
