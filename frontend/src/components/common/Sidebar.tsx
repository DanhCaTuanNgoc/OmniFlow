'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Network, Cpu, Library, Vault, FileText, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

const items = [
  { label: 'Pipeline Studio', href: '/workspace/studio', icon: Network },
  { label: 'Active Automations', href: '/workspace/active', icon: Cpu },
  { label: 'Template Library', href: '/workspace/templates', icon: Library },
  { label: 'Vault Manager', href: '/workspace/vault', icon: Vault },
  { label: 'Activity Logs', href: '/workspace/logs', icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`shrink-0 flex flex-col border-r border-[var(--ws-border)] bg-[var(--ws-rail)] transition-[width] duration-200 ease-in-out ${
        collapsed ? 'w-14' : 'w-14 lg:w-56'
      }`}
    >
      <div
        className={`flex h-14 shrink-0 items-center border-b border-[var(--ws-border)] ${
          collapsed ? 'justify-center' : 'justify-center lg:justify-between px-2 lg:px-4'
        }`}
      >
        {collapsed ? (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="grid size-9 place-items-center rounded-md text-[var(--ws-muted)] hover:bg-white/5 hover:text-white transition-colors"
            title="Expand Workspace sidebar"
            aria-label="Expand Workspace sidebar"
          >
            <PanelLeftOpen size={16} />
          </button>
        ) : (
          <>
            <Link
              href="/workspace/studio"
              className="hidden lg:block text-sm font-semibold tracking-tight text-white hover:text-[var(--ws-accent)] transition-colors truncate"
              title="OmniFlow Workspace"
            >
              Workspace
            </Link>
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="grid size-9 place-items-center rounded-md text-[var(--ws-muted)] hover:bg-white/5 hover:text-white transition-colors"
              title="Collapse Workspace sidebar"
              aria-label="Collapse Workspace sidebar"
            >
              <PanelLeftClose size={16} />
            </button>
          </>
        )}
      </div>

      <nav aria-label="Workspace" className="flex flex-1 flex-col gap-1 p-2 lg:pt-4">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              title={label}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-10 items-center gap-3 rounded-md text-[13px] transition-colors ${
                collapsed ? 'justify-center' : 'justify-center lg:justify-start lg:px-2.5'
              } ${
                active
                  ? 'bg-[var(--ws-accent-bg)] text-[var(--ws-accent)] font-semibold'
                  : 'text-[var(--ws-muted)] hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={16} aria-hidden="true" className="shrink-0" />
              {!collapsed && <span className="hidden truncate lg:block">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <p className="hidden border-t border-[var(--ws-border)] px-4 py-3 text-xs text-[var(--ws-muted)] lg:block">
          Base Sepolia / Reactive Lasna
        </p>
      )}
    </aside>
  );
}
