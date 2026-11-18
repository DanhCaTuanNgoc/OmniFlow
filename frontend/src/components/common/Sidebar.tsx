'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Network, 
  Cpu, 
  Library, 
  Vault, 
  FileText, 
  ExternalLink,
  Zap,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  {
    name: 'Pipeline Studio',
    href: '/workspace/studio',
    icon: Network,
    badge: '10 Nodes',
  },
  {
    name: 'Active Automations',
    href: '/workspace/active',
    icon: Cpu,
  },
  {
    name: 'Template Library',
    href: '/workspace/templates',
    icon: Library,
  },
  {
    name: 'Vault Manager',
    href: '/workspace/vault',
    icon: Vault,
  },
  {
    name: 'Activity Logs',
    href: '/workspace/logs',
    icon: FileText,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'border-r border-white/[0.08] bg-[#000000] flex flex-col justify-between select-none transition-[width] duration-200 will-change-[width] z-20 shrink-0 font-sans',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div>
        <div className="p-3.5 border-b border-white/[0.08] bg-[#050608] flex items-center justify-between">
          <Link
            href="/workspace/studio"
            prefetch={true}
            className={cn('flex items-center gap-3 group overflow-hidden', collapsed && 'justify-center w-full')}
          >
            {/* Motion UI circular logo button */}
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-[0_2px_10px_rgba(255,255,255,0.2)] group-hover:scale-105 transition-transform shrink-0">
              <Zap className="w-4 h-4 text-black fill-black" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold text-sm tracking-tight text-white truncate">
                    OmniFlow
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/[0.08] text-[#c4c2c3] border border-white/20 font-semibold">
                    v1.0
                  </span>
                </div>
                <p className="text-[11px] text-[#8e8e8e] font-medium truncate">
                  The Zapier of Web3
                </p>
              </div>
            )}
          </Link>

          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-2 space-y-1">
          {!collapsed && (
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8e8e8e] px-3 py-1.5 font-mono">
              Workspace
            </div>
          )}
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href === '/workspace/studio' && pathname === '/workspace');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                title={collapsed ? item.name : undefined}
                className={cn(
                  'flex items-center text-xs rounded-full font-medium transition-colors duration-150 cursor-pointer relative group',
                  collapsed
                    ? 'justify-center p-2.5'
                    : 'justify-between px-3.5 py-2.5',
                  isActive
                    ? 'bg-[#18191e] text-white font-semibold border border-white/20 shadow-sm'
                    : 'text-[#8e8e8e] hover:text-white hover:bg-white/[0.04]'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={cn('w-4 h-4 shrink-0 transition-colors', isActive ? 'text-white' : 'text-[#8e8e8e] group-hover:text-white')} />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </div>
                {!collapsed && (
                  <div className="flex items-center gap-1.5">
                    {isActive && (
                      <span className="flex items-center gap-0.5 text-white/50 text-[10px]">
                        <span className="w-1 h-1 rounded-full bg-white" />
                        <span className="w-1 h-1 rounded-full bg-white/60" />
                        <span className="w-1 h-1 rounded-full bg-white/30" />
                      </span>
                    )}
                    {item.badge && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-[#c4c2c3] border border-white/10 shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Network Live Telemetry Footer */}
      <div className="p-2.5 bg-[#050608] border-t border-white/[0.08]">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Live Networks Online" />
            <button
              onClick={() => setCollapsed(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-[#0b0c10] border border-white/[0.08] space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-white font-semibold text-xs">Live Networks</span>
              </div>
              <span className="text-emerald-400 font-mono font-medium px-2 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-[10px]">
                ONLINE
              </span>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between p-1.5 px-2.5 rounded-xl bg-[#000000] border border-white/[0.05]">
                <span className="text-[#8e8e8e]">Base Sepolia</span>
                <span className="text-cyan-400 font-mono font-medium tabular-nums">200ms Denim</span>
              </div>

              <div className="flex items-center justify-between p-1.5 px-2.5 rounded-xl bg-[#000000] border border-white/[0.05]">
                <span className="text-[#8e8e8e]">Reactive Lasna</span>
                <span className="text-violet-300 font-mono font-medium tabular-nums">~1s RVM</span>
              </div>
            </div>

            <a
              href="https://lasna.reactscan.net"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between text-[11px] text-[#8e8e8e] hover:text-white pt-1 transition-colors"
            >
              <span>ReactScan Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </aside>
  );
}
