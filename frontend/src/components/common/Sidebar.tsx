'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Network, Cpu, Library, Vault, FileText, PanelLeft, Zap } from 'lucide-react';

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
    <aside className={`shrink-0 flex flex-col border-r border-[var(--ws-border)] bg-[var(--ws-rail)] ${collapsed ? 'w-14' : 'w-14 lg:w-56'}`}>
      <div className={`flex h-14 shrink-0 items-center gap-2 border-b border-[var(--ws-border)] ${collapsed ? 'justify-center' : 'justify-center lg:justify-between lg:px-4'}`}>
        <Link href="/workspace/studio" aria-label="OmniFlow Studio" className="flex items-center gap-2.5 rounded-md">
          <span className="grid size-8 place-items-center rounded-lg bg-[var(--ws-accent)] text-[#201735]">
            <Zap size={17} aria-hidden="true" />
          </span>
          {!collapsed && <span className="hidden text-sm font-semibold tracking-tight lg:block">OmniFlow</span>}
        </Link>
        {!collapsed && (
          <button type="button" onClick={() => setCollapsed(true)} className="hidden rounded p-1.5 text-[var(--ws-muted)] hover:text-white lg:block" aria-label="Collapse sidebar">
            <PanelLeft size={16} />
          </button>
        )}
      </div>
      <nav aria-label="Workspace" className="flex flex-1 flex-col gap-1 p-2 lg:pt-4">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href} href={href} title={label} aria-label={label} aria-current={active ? 'page' : undefined}
              className={`flex min-h-10 items-center gap-3 rounded-md text-[13px] transition-colors ${collapsed ? 'justify-center' : 'justify-center lg:justify-start lg:px-2.5'} ${active ? 'bg-[var(--ws-accent-bg)] text-[var(--ws-accent)] font-semibold' : 'text-[var(--ws-muted)] hover:bg-white/5 hover:text-white'}`}
            >
              <Icon size={16} aria-hidden="true" className="shrink-0" />
              {!collapsed && <span className="hidden truncate lg:block">{label}</span>}
            </Link>
          );
        })}
      </nav>
      {collapsed && (
        <button type="button" onClick={() => setCollapsed(false)} className="m-2 hidden place-items-center rounded-md p-2 text-[var(--ws-muted)] hover:bg-white/5 lg:grid" aria-label="Expand sidebar">
          <PanelLeft size={16} />
        </button>
      )}
      {!collapsed && <p className="hidden border-t border-[var(--ws-border)] px-4 py-3 text-xs text-[var(--ws-muted)] lg:block">Base Sepolia / Reactive Lasna</p>}
    </aside>
  );
}
