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
  ExternalLink,
  Zap,
  Radio
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
    <aside className="w-64 border-r border-[#2E1E54]/60 bg-[#0B0716] flex flex-col justify-between select-none">
      {/* Brand Header */}
      <div>
        <div className="p-4 border-b border-[#2E1E54]/60 bg-[#0E091C]/60">
          <Link href="/workspace/studio" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/30 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-white">
                  OmniFlow
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-purple-950/70 text-purple-300 border border-purple-800/50 font-semibold">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-purple-300/60 font-medium">
                The Zapier of Web3
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-purple-300/50 px-3 py-1.5">
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
                  'flex items-center justify-between px-3.5 py-2.5 text-xs rounded-xl font-medium transition-all cursor-pointer',
                  isActive
                    ? 'bg-gradient-to-r from-purple-900/50 to-purple-950/20 text-white font-semibold shadow-sm border border-purple-800/40'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#150E28]'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={cn('w-4 h-4', isActive ? 'text-violet-400' : 'text-purple-400/60')} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Network Live Telemetry Footer (Rounded Glass Panel) */}
      <div className="p-3 bg-[#08050F]/70 border-t border-[#2E1E54]/60">
        <div className="p-3.5 rounded-2xl bg-[#110B1F]/90 border border-[#2E1E54] space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-purple-900/30 text-xs">
            <div className="flex items-center gap-2">
              <span className="status-dot status-dot-emerald" />
              <span className="text-slate-300 font-semibold">Live Networks</span>
            </div>
            <span className="text-emerald-400 font-medium px-2 py-0.5 rounded-full border border-emerald-900/40 bg-emerald-950/40 text-[10px]">
              Online
            </span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#08050F]/80 border border-purple-900/20">
              <span className="text-slate-300">Base Sepolia</span>
              <span className="text-cyan-400 font-mono font-medium tabular-nums">200ms Denim</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-[#08050F]/80 border border-purple-900/20">
              <span className="text-slate-300">Reactive Lasna</span>
              <span className="text-violet-300 font-mono font-medium tabular-nums">~1s RVM</span>
            </div>
          </div>

          <a
            href="https://lasna.reactscan.net"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between text-[11px] text-purple-300/60 hover:text-purple-200 pt-1 transition-colors"
          >
            <span>ReactScan Explorer</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </aside>
  );
}
