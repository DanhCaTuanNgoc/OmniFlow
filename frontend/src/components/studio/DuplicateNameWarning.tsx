'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

export function DuplicateNameWarning({
  name,
  className = '',
}: {
  name: string;
  className?: string;
}) {
  const trimmed = name.trim();
  if (!trimmed) return null;

  return (
    <div
      role="status"
      className={`flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-200 ${className}`.trim()}
    >
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-400" aria-hidden="true" />
      <span>
        A pipeline named <strong className="font-semibold text-amber-100">&ldquo;{trimmed}&rdquo;</strong> already exists.
        You can still use this name, though identical names may be harder to distinguish in Active Automations and Activity Logs.
      </span>
    </div>
  );
}
