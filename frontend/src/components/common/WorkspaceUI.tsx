import Link from 'next/link';
import type { ReactNode } from 'react';

export function WorkspacePageHeader({
  title,
  description,
  icon,
  actions,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="ws-page-header">
      <div>
        <div className="flex items-center gap-2.5">
          {icon && (
            <span className="grid size-8 place-items-center rounded-lg bg-[var(--ws-accent-bg)] text-[var(--ws-accent)] shrink-0">
              {icon}
            </span>
          )}
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {title}
          </h1>
        </div>
        {description && (
          <p className="text-xs sm:text-sm text-[var(--ws-muted)] mt-1">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="ws-actions">{actions}</div>}
    </header>
  );
}

export function WorkspaceState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: { label: string; href: string };
}) {
  return (
    <section className="rounded-xl border border-dashed border-[var(--ws-border)] bg-[var(--ws-panel)]/50 p-10 text-center space-y-4 my-2">
      {icon && (
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-[var(--ws-accent-bg)] text-[var(--ws-accent)]">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {description && (
          <p className="text-xs text-[var(--ws-muted)] max-w-sm mx-auto leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex items-center justify-center pt-2">
          <Link className="ws-button ws-button-primary inline-flex items-center gap-1.5" href={action.href}>
            {action.label}
          </Link>
        </div>
      )}
    </section>
  );
}

