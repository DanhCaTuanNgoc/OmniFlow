import Link from 'next/link';
import type { ReactNode } from 'react';

export function WorkspacePageHeader({ title, description, actions }: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="ws-page-header">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="ws-actions">{actions}</div>}
    </header>
  );
}

export function WorkspaceState({ title, description, action }: {
  title: string;
  description?: string;
  action?: { label: string; href: string };
}) {
  return (
    <section className="ws-state">
      <div role="status">
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action && <Link className="ws-button" href={action.href}>{action.label}</Link>}
    </section>
  );
}
