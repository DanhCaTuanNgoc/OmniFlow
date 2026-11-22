'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Crosshair, Info, X } from 'lucide-react';

export type ToastNotification = {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title?: string;
  tag?: string;
  nodeLabel?: string;
  message: string;
  nodeId?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
};

export function ToastContainer({
  toasts,
  notifications,
  onDismiss,
  onSelectNode,
}: {
  toasts?: ToastNotification[];
  notifications?: ToastNotification[];
  onDismiss: (id: string) => void;
  onSelectNode?: (nodeId: string) => void;
}) {
  const items = toasts ?? notifications ?? [];
  if (!items.length) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-full max-w-[22rem] sm:max-w-[24rem] flex-col-reverse gap-2 select-none"
      aria-live="polite"
    >
      {items.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
          onSelectNode={onSelectNode}
        />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
  onSelectNode,
}: {
  toast: ToastNotification;
  onDismiss: (id: string) => void;
  onSelectNode?: (nodeId: string) => void;
}) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const duration = toast.duration ?? 2800;
    const timer = setTimeout(() => {
      setIsClosing(true);
      setTimeout(() => onDismiss(toast.id), 180);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const handleManualDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsClosing(true);
    setTimeout(() => onDismiss(toast.id), 180);
  };

  const handleClick = () => {
    if (toast.action) {
      toast.action.onClick();
    } else if (toast.nodeId && onSelectNode) {
      onSelectNode(toast.nodeId);
    }
  };

  const isError = toast.type === 'error';
  const isWarning = toast.type === 'warning';
  const isSuccess = toast.type === 'success';
  const displayTag = toast.tag || toast.nodeLabel;
  const isClickable = Boolean(toast.action || (toast.nodeId && onSelectNode));

  return (
    <div
      onClick={isClickable ? handleClick : undefined}
      role={isError ? 'alert' : 'status'}
      className={`group pointer-events-auto relative flex items-start gap-2.5 rounded-lg border border-[var(--ws-border)] bg-[#0d0f17]/95 p-3 shadow-2xl backdrop-blur-md transition-all duration-150 ${
        isClosing
          ? 'opacity-0 translate-y-1 scale-[0.98]'
          : 'animate-in fade-in slide-in-from-bottom-2 duration-150'
      } ${
        isClickable ? 'cursor-pointer hover:border-zinc-700 hover:bg-[#12141f]/95' : ''
      } ${
        isError
          ? 'border-l-[3px] border-l-rose-500'
          : isWarning
          ? 'border-l-[3px] border-l-amber-500'
          : isSuccess
          ? 'border-l-[3px] border-l-emerald-500'
          : 'border-l-[3px] border-l-cyan-500'
      }`}
    >
      <div
        className={`grid size-6 shrink-0 place-items-center rounded-md border text-xs ${
          isError
            ? 'border-rose-500/25 bg-rose-500/10 text-rose-400'
            : isWarning
            ? 'border-amber-500/25 bg-amber-500/10 text-amber-400'
            : isSuccess
            ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400'
            : 'border-cyan-500/25 bg-cyan-500/10 text-cyan-400'
        }`}
      >
        {isError && <AlertCircle className="size-3.5" />}
        {isWarning && <AlertTriangle className="size-3.5" />}
        {isSuccess && <CheckCircle2 className="size-3.5" />}
        {!isError && !isWarning && !isSuccess && <Info className="size-3.5" />}
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            {displayTag && (
              <span className="shrink-0 rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] font-medium text-zinc-300 border border-white/10">
                {displayTag}
              </span>
            )}
            {toast.title && (
              <span className="truncate text-xs font-medium text-zinc-200 tracking-tight">
                {toast.title}
              </span>
            )}
          </div>

          {toast.action ? (
            <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] text-cyan-400 group-hover:text-cyan-300 transition-colors">
              {toast.action.label}
            </span>
          ) : toast.nodeId ? (
            <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] text-zinc-400 group-hover:text-cyan-300 transition-colors">
              <Crosshair className="size-3" />
              <span>Locate</span>
            </span>
          ) : null}
        </div>

        <p className="text-[11px] leading-relaxed text-zinc-400 break-words font-sans">
          {toast.message}
        </p>
      </div>

      <button
        type="button"
        onClick={handleManualDismiss}
        className="shrink-0 -mr-1 -mt-1 p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
