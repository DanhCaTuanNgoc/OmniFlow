'use client';

import React, { type ReactNode } from 'react';
import { Check, X, Loader2, Minus } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Tone = 'good' | 'warn' | 'bad' | 'info' | 'muted';

export const toneText: Record<Tone, string> = {
  good: 'text-emerald-400',
  warn: 'text-amber-400',
  bad: 'text-rose-400',
  info: 'text-violet-400',
  muted: 'text-slate-400',
};

const toneDot: Record<Tone, string> = {
  good: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  warn: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  bad: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
  info: 'bg-violet-500/15 text-violet-300 border border-violet-500/30',
  muted: 'bg-white/5 text-slate-400 border border-white/10',
};

/** A result as a word in a soft tinted pill: Pass, Active, Regression, Panic... */
export function Status({
  tone,
  children,
  className,
}: {
  tone: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-mono font-medium whitespace-nowrap',
        toneDot[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/** Modern status icon mark */
export function Mark({ state }: { state: 'ok' | 'bad' | 'wait' | 'skip' | 'run' }) {
  const c = 'w-4 h-4 shrink-0';
  if (state === 'ok') return <Check className={cn(c, 'text-emerald-400')} aria-label="ok" />;
  if (state === 'bad') return <X className={cn(c, 'text-rose-400')} aria-label="failed" />;
  if (state === 'run') return <Loader2 className={cn(c, 'animate-spin text-violet-400')} aria-label="running" />;
  if (state === 'skip') return <Minus className={cn(c, 'text-slate-500')} aria-label="skipped" />;
  return (
    <span
      className={cn(c, 'inline-block rounded-full border border-dashed border-slate-500/40')}
      aria-label="waiting"
    />
  );
}

/** Canary-style clean card panel */
export function Panel({
  title,
  description,
  action,
  children,
  className,
  flush,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <div
      className={cn(
        'min-w-0 rounded-2xl bg-[#0e1017]/90 border border-white/10 shadow-xl backdrop-blur-xl overflow-hidden',
        className
      )}
    >
      {(title || action) && (
        <div className="border-b border-white/10 px-5 py-4 flex items-center justify-between">
          <div>
            {title && <div className="text-sm font-semibold text-white tracking-tight">{title}</div>}
            {description && <div className="text-xs text-slate-400 mt-0.5">{description}</div>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={cn(flush ? 'p-0' : 'px-5 py-4')}>{children}</div>
    </div>
  );
}

/** 2-column key-value rows */
export function KV({
  rows,
  className,
}: {
  rows: [ReactNode, ReactNode][];
  className?: string;
}) {
  return (
    <dl className={cn('divide-y divide-white/5 text-xs font-mono', className)}>
      {rows.map(([k, v], i) => (
        <div key={i} className="grid grid-cols-[minmax(96px,160px)_1fr] gap-4 px-5 py-3 items-center">
          <dt className="text-slate-400">{k}</dt>
          <dd className="min-w-0 break-words text-white font-medium">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Canary 4-block headline stats strip with hairline dividers */
export function Stats({
  items,
}: {
  items: { label: string; value: ReactNode; tone?: Tone; subtitle?: string }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-4 shadow-xl">
      {items.map((s) => (
        <div key={s.label} className="bg-[#0e1017]/95 p-5">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400">{s.label}</div>
          <div
            className={cn(
              'mt-1 font-mono text-2xl font-bold tracking-tight text-white tabular-nums',
              s.tone && toneText[s.tone]
            )}
          >
            {s.value}
          </div>
          {s.subtitle && <p className="text-xs text-slate-400 mt-1">{s.subtitle}</p>}
        </div>
      ))}
    </div>
  );
}

export const Mono = ({ children, className }: { children: ReactNode; className?: string }) => (
  <code className={cn('font-mono text-xs text-slate-300 bg-black/40 px-2 py-0.5 rounded border border-white/5', className)}>
    {children}
  </code>
);

export const fmt = (n: number | null | undefined) => (n == null ? '–' : n.toLocaleString('en'));

export function downloadJson(name: string, data: unknown) {
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
