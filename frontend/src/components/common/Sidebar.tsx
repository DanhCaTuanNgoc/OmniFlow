'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Network, 
  Cpu, 
  Library, 
  Vault, 
  FileText, 
  Radio, 
  ExternalLink,
  Zap
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

  return (
    <aside className="w-64 border-r border-slate-800 bg-[#0B1120] flex flex-col justify-between select-none">
      {/* Brand Header */}
      <div>
        <div className="p-4 border-b border-slate-800">
          <Link href="/workspace/studio" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 text-slate-950 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-slate-100">
                  OmniFlow
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-tight">
                The Zapier of Web3
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1">
            Workspace
          </div>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href === '/workspace/studio' && pathname === '/workspace');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150',
                  isActive
                    ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={cn('w-4 h-4', isActive ? 'text-cyan-400' : 'text-slate-400')} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Network Live Pulse Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2 text-xs">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5 font-medium">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            Live Networks
          </span>
          <span className="font-mono text-[10px] text-emerald-400">Online</span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900 border border-slate-800/80 text-[11px]">
            <span className="text-slate-300">Base Sepolia</span>
            <span className="font-mono text-cyan-400 text-[10px]">200ms Denim</span>
          </div>

          <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900 border border-slate-800/80 text-[11px]">
            <span className="text-slate-300">Reactive Lasna</span>
            <span className="font-mono text-purple-400 text-[10px]">~1s RVM</span>
          </div>
        </div>

        <a
          href="https://lasna.reactscan.net"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors pt-1"
        >
          ReactScan Explorer <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    </aside>
  );
}
