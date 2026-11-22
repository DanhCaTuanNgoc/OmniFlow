'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { MoreVertical, Edit3, Copy, Download, Trash2, Archive, ArchiveRestore, FileText } from 'lucide-react';

export interface PipelineKebabMenuProps {
  onOpenDraft?: () => void;
  automationHref?: string;
  onRename?: () => void;
  renameLabel?: string;
  onDuplicate?: () => void;
  onExport?: () => void;
  onDelete?: () => void;
  onArchive?: () => void;
  isArchived?: boolean;
  canDelete?: boolean;
}

export function PipelineKebabMenu({
  onOpenDraft,
  automationHref,
  onRename,
  renameLabel = 'Rename & Notes',
  onDuplicate,
  onExport,
  onDelete,
  onArchive,
  isArchived = false,
  canDelete = true,
}: PipelineKebabMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen((prev) => !prev);
  };

  const handleAction = (e: React.MouseEvent, action?: () => void) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(false);
    action?.();
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={toggle}
        aria-label="Pipeline options"
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="flex size-7 items-center justify-center rounded-md border border-transparent text-[var(--ws-muted)] transition-colors hover:border-[var(--ws-border)] hover:bg-white/5 hover:text-white focus:outline-none"
      >
        <MoreVertical className="size-4" />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 top-full z-50 mt-1 w-44 origin-top-right rounded-lg border border-[var(--ws-border)] bg-[#191c24] py-1 shadow-2xl backdrop-blur-md focus:outline-none animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          {automationHref && (
            <Link href={automationHref} role="menuitem"
              onClick={event => { event.stopPropagation(); setIsOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-zinc-200 transition-colors hover:bg-white/5 hover:text-white">
              Manage Automation
            </Link>
          )}
          {onOpenDraft && (
            <button
              type="button"
              role="menuitem"
              onClick={(e) => handleAction(e, onOpenDraft)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-zinc-200 transition-colors hover:bg-white/5 hover:text-white"
            >
              <FileText className="size-3.5 text-zinc-300" />
              <span>Open Draft</span>
            </button>
          )}

          {onRename && (
            <button
              type="button"
              role="menuitem"
              onClick={(e) => handleAction(e, onRename)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-zinc-200 transition-colors hover:bg-white/5 hover:text-white"
            >
              <Edit3 className="size-3.5 text-[var(--ws-accent)]" />
              <span>{renameLabel}</span>
            </button>
          )}

          {onDuplicate && (
            <button
              type="button"
              role="menuitem"
              onClick={(e) => handleAction(e, onDuplicate)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-zinc-200 transition-colors hover:bg-white/5 hover:text-white"
            >
              <Copy className="size-3.5 text-sky-400" />
              <span>Duplicate pipeline</span>
            </button>
          )}

          {onExport && (
            <button
              type="button"
              role="menuitem"
              onClick={(e) => handleAction(e, onExport)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-zinc-200 transition-colors hover:bg-white/5 hover:text-white"
            >
              <Download className="size-3.5 text-emerald-400" />
              <span>Export JSON</span>
            </button>
          )}

          {onArchive && (
            <button
              type="button"
              role="menuitem"
              onClick={(e) => handleAction(e, onArchive)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-zinc-200 transition-colors hover:bg-white/5 hover:text-white"
            >
              {isArchived ? (
                <>
                  <ArchiveRestore className="size-3.5 text-amber-400" />
                  <span>Unarchive</span>
                </>
              ) : (
                <>
                  <Archive className="size-3.5 text-amber-400" />
                  <span>Archive pipeline</span>
                </>
              )}
            </button>
          )}

          {canDelete && onDelete && (
            <>
              <div className="my-1 border-t border-[var(--ws-border)]" />
              <button
                type="button"
                role="menuitem"
                onClick={(e) => handleAction(e, onDelete)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-rose-400 transition-colors hover:bg-rose-950/40 hover:text-rose-300"
              >
                <Trash2 className="size-3.5" />
              <span>Delete saved draft</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
