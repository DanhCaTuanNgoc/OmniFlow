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
    badge: '10 NODES',
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
    <aside className="w-64 border-r border-[#1C142E] bg-[#0B0813] flex flex-col justify-between select-none">
      {/* Brand Header */}
      <div>
        <div className="p-4 border-b border-[#1C142E] bg-[#06040A]">
          <Link href="/workspace/studio" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-none bg-[#110C1E] border border-[#8B5CF6] flex items-center justify-center shadow-md shadow-[#8B5CF6]/20 group-hover:bg-[#8B5CF6]/20 transition-all">
              <Zap className="w-5 h-5 text-[#8B5CF6]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-wider uppercase text-white font-mono">
                  OMNIFLOW
                </span>
                <span className="text-[9px] font-mono px-1 py-0.2 rounded-none bg-[#110C1E] text-[#C084FC] border border-[#2E1F4A] font-bold">
                  v1.0
                </span>
              </div>
              <p className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase">
                THE ZAPIER OF WEB3
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="p-2 space-y-1">
          <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-500 px-3 py-1.5">
            // CONSOLE MODULES
          </div>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href === '/workspace/studio' && pathname === '/workspace');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center justify-between px-3 py-2 text-xs font-mono tracking-wider uppercase transition-colors cursor-pointer rounded-none border-l-2',
                  isActive
                    ? 'bg-[#110C1E] text-white border-[#8B5CF6] font-bold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#110C1E]/60 border-transparent'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={cn('w-4 h-4', isActive ? 'text-[#8B5CF6]' : 'text-zinc-500')} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-none bg-[#171028] text-[#C084FC] border border-[#2E1F4A]">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Network Live Telemetry Footer (Tech Corner Accent) */}
      <div className="p-3 bg-[#06040A] border-t border-[#1C142E]">
        <div className="tech-corner-accent p-3 bg-[#0B0813] border border-[#1C142E] space-y-2.5 font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-[#1C142E] text-[10px]">
            <div className="flex items-center gap-2">
              <span className="status-pip status-pip-emerald" />
              <span className="text-zinc-400 font-bold tracking-widest uppercase">LIVE NETWORKS</span>
            </div>
            <span className="text-emerald-400 font-bold px-1 py-0.2 border border-emerald-900/60 bg-emerald-950/40 text-[9px]">
              ONLINE
            </span>
          </div>

          <div className="space-y-1.5 text-[10px]">
            <div className="flex items-center justify-between p-1.5 bg-[#06040A] border border-[#1C142E]">
              <span className="text-zinc-400">BASE SEPOLIA</span>
              <span className="text-cyan-400 font-bold tabular-nums">200ms DENIM</span>
            </div>

            <div className="flex items-center justify-between p-1.5 bg-[#06040A] border border-[#1C142E]">
              <span className="text-zinc-400">REACTIVE LASNA</span>
              <span className="text-[#C084FC] font-bold tabular-nums">~1s RVM</span>
            </div>
          </div>

          <a
            href="https://lasna.reactscan.net"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between text-[9px] text-zinc-500 hover:text-zinc-300 pt-1 transition-colors uppercase tracking-wider"
          >
            <span>REACTSCAN EXPLORER</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </aside>
  );
}
