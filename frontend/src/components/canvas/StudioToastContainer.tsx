'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export type StudioNotification = {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title?: string;
  message: string;
  nodeId?: string;
  duration?: number;
};

export function StudioToastContainer({
  notifications,
  onDismiss,
  onSelectNode,
}: {
  notifications: StudioNotification[];
  onDismiss: (id: string) => void;
  onSelectNode?: (nodeId: string) => void;
}) {
  if (!notifications.length) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-5 right-5 z-50 flex max-w-sm w-full flex-col-reverse gap-2 sm:max-w-md select-none"
      aria-live="polite"
    >
      {notifications.map((toast) => (
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
  toast: StudioNotification;
  onDismiss: (id: string) => void;
  onSelectNode?: (nodeId: string) => void;
}) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const duration = toast.duration ?? 2800;
    const timer = setTimeout(() => {
      setIsClosing(true);
      setTimeout(() => onDismiss(toast.id), 200);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const handleManualDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsClosing(true);
    setTimeout(() => onDismiss(toast.id), 200);
  };

  const handleClick = () => {
    if (toast.nodeId && onSelectNode) {
      onSelectNode(toast.nodeId);
    }
  };

  const isError = toast.type === 'error';
  const isWarning = toast.type === 'warning';
  const isSuccess = toast.type === 'success';

  return (
    <div
      onClick={handleClick}
      role={isError ? 'alert' : 'status'}
      className={`pointer-events-auto flex items-start gap-2.5 rounded-xl border p-3 shadow-2xl backdrop-blur-md transition-all duration-200 ${
        isClosing ? 'opacity-0 translate-y-2 scale-95' : 'animate-in fade-in slide-in-from-bottom-2 duration-200'
      } ${
        toast.nodeId ? 'cursor-pointer hover:border-zinc-400' : ''
      } ${
        isError
          ? 'bg-[#180e12]/95 border-rose-500/40 text-rose-200'
          : isWarning
          ? 'bg-[#18130a]/95 border-amber-500/40 text-amber-200'
          : isSuccess
          ? 'bg-[#0c1813]/95 border-emerald-500/40 text-emerald-200'
          : 'bg-[#111318]/95 border-[var(--ws-border)] text-zinc-200'
      }`}
    >
      <div className="mt-0.5 shrink-0">
        {isError && <AlertCircle className="size-4 text-rose-400" />}
        {isWarning && <AlertTriangle className="size-4 text-amber-400" />}
        {isSuccess && <CheckCircle2 className="size-4 text-emerald-400" />}
        {!isError && !isWarning && !isSuccess && <Info className="size-4 text-cyan-400" />}
      </div>

      <div className="min-w-0 flex-1 space-y-0.5">
        {toast.title && (
          <div className="text-xs font-semibold leading-tight text-white flex items-center justify-between">
            <span>{toast.title}</span>
            {toast.nodeId && (
              <span className="text-[10px] text-zinc-400 font-normal">Click to focus</span>
            )}
          </div>
        )}
        <div className="text-xs leading-relaxed opacity-90 break-words">
          {toast.message}
        </div>
      </div>

      <button
        type="button"
        onClick={handleManualDismiss}
        className="shrink-0 p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
