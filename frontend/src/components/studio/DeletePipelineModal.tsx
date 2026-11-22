'use client';

import React, { useEffect } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

export interface DeletePipelineModalProps {
  isOpen: boolean;
  pipelineName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeletePipelineModal({
  isOpen,
  pipelineName,
  onClose,
  onConfirm,
}: DeletePipelineModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-pipeline-title"
    >
      <div
        className="relative w-full max-w-md rounded-xl border border-[var(--ws-border)] bg-[#191c24] p-5 shadow-2xl text-[var(--ws-text)] space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--ws-border)] pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <AlertTriangle className="size-4" />
            </div>
            <div>
              <h2 id="delete-pipeline-title" className="text-sm font-semibold tracking-tight text-white">
                Delete Draft
              </h2>
              <p className="text-xs text-[var(--ws-muted)]">
                Permanent draft removal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[var(--ws-muted)] hover:bg-white/5 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-3">
          <p className="text-xs text-zinc-300 leading-relaxed">
            Are you sure you want to delete <strong className="text-white font-semibold break-all">"{pipelineName}"</strong>? This action cannot be undone.
          </p>
          <div className="rounded-md border border-rose-900/40 bg-rose-950/20 p-2.5 text-[11px] text-rose-300">
            Deleting this draft removes its saved graph and node configuration from your workspace.
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--ws-border)]">
          <button
            type="button"
            onClick={onClose}
            className="ws-button"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="ws-button border-rose-600 bg-rose-600 text-white hover:bg-rose-600 hover:border-rose-600 hover:text-white cursor-pointer"
          >
            <Trash2 className="size-3.5" />
            <span>Delete Draft</span>
          </button>
        </div>
      </div>
    </div>
  );
}
