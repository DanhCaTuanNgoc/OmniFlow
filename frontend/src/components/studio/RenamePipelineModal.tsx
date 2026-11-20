'use client';

import React, { useState, useEffect } from 'react';
import { X, Edit3, Check } from 'lucide-react';

export interface RenamePipelineModalProps {
  isOpen: boolean;
  currentName: string;
  currentDescription?: string;
  onClose: () => void;
  onSave: (newName: string, newDescription: string) => void;
}

export function RenamePipelineModal({
  isOpen,
  currentName,
  currentDescription = '',
  onClose,
  onSave,
}: RenamePipelineModalProps) {
  const [name, setName] = useState(currentName);
  const [description, setDescription] = useState(currentDescription);

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setDescription(currentDescription || '');
    }
  }, [isOpen, currentName, currentDescription]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), description.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rename-pipeline-title"
    >
      <div
        className="relative w-full max-w-md rounded-xl border border-[var(--ws-border)] bg-[#191c24] p-5 shadow-2xl text-[var(--ws-text)] space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--ws-border)] pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-[var(--ws-accent-bg)] text-[var(--ws-accent)]">
              <Edit3 className="size-4" />
            </div>
            <div>
              <h2 id="rename-pipeline-title" className="text-sm font-semibold tracking-tight">
                Rename &amp; Notes
              </h2>
              <p className="text-xs text-[var(--ws-muted)]">
                Update pipeline title and description notes.
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="pipeline-name-input" className="block text-xs font-medium text-[var(--ws-muted)]">
              Pipeline Name <span className="text-rose-400">*</span>
            </label>
            <input
              id="pipeline-name-input"
              type="text"
              required
              autoFocus
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Stop-Loss ETH / USDC"
              className="w-full rounded-md border border-[var(--ws-border)] bg-[#111318] px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-[var(--ws-accent)] focus:outline-none focus:ring-0"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="pipeline-desc-input" className="block text-xs font-medium text-[var(--ws-muted)]">
              Description / Notes (Optional)
            </label>
            <textarea
              id="pipeline-desc-input"
              rows={3}
              maxLength={300}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add runbook notes or description for this pipeline..."
              className="w-full rounded-md border border-[var(--ws-border)] bg-[#111318] px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-[var(--ws-accent)] focus:outline-none focus:ring-0 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--ws-border)]">
            <button
              type="button"
              onClick={onClose}
              className="ws-button"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="ws-button ws-button-primary"
            >
              <Check className="size-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
