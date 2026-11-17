'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { 
  Wallet, 
  ChevronDown, 
  LogOut, 
  Sparkles,
  Layers
} from 'lucide-react';
import { truncateAddress } from '@/lib/utils';

const ROUTE_NAMES: Record<string, string> = {
  '/workspace/studio': 'Pipeline Studio',
  '/workspace/active': 'Active Automations',
  '/workspace/templates': 'Template Library',
  '/workspace/vault': 'Vault Manager',
  '/workspace/logs': 'Activity Logs',
};

export function Header() {
  const pathname = usePathname();
  const currentTitle = ROUTE_NAMES[pathname] || 'Pipeline Studio';
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleConnect = () => {
    const injectedConnector = connectors[0];
    if (injectedConnector) {
      connect({ connector: injectedConnector });
    }
  };

  return (
    <header className="h-16 border-b border-white/[0.08] bg-[#08090D]/85 backdrop-blur-xl px-6 flex items-center justify-between z-20 select-none">
      {/* Left Breadcrumb & Mode */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="text-slate-400">Workspace</span>
          <span className="text-slate-600">/</span>
          <span className="font-semibold text-white">{currentTitle}</span>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[11px] font-medium shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span>Reactive Omni Live Testnet</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Active Chain Pill */}
        <div className="hidden md:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#0E1017] border border-white/[0.08] text-xs">
          <span className="status-dot status-dot-emerald" />
          <span className="font-medium text-slate-200">
            {chain?.name || 'Base Sepolia'}
          </span>
          <span className="text-[11px] font-mono text-cyan-400 tabular-nums">#84532</span>
        </div>

        {/* Wallet Button */}
        {isConnected && address ? (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 py-1.5 px-4 rounded-full bg-[#0E1017] hover:bg-[#161922] border border-white/[0.08] hover:border-white/[0.16] text-slate-100 text-xs font-mono font-medium transition-all shadow-sm cursor-pointer"
            >
              <span className="status-dot status-dot-emerald" />
              <span className="tabular-nums tracking-wide">{truncateAddress(address)}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#0E1017] border border-white/[0.10] shadow-2xl py-1.5 text-xs text-slate-200 z-50 backdrop-blur-2xl">
                <div className="px-3.5 py-2 border-b border-white/[0.06] text-[11px] text-slate-400 flex items-center justify-between font-medium">
                  <span>MetaMask Connected</span>
                  <span className="text-emerald-400 text-[10px]">Active</span>
                </div>
                <button
                  onClick={() => {
                    disconnect();
                    setDropdownOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-rose-500/10 hover:text-rose-300 flex items-center gap-2.5 transition-colors cursor-pointer text-slate-300"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect Wallet</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleConnect}
            className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-full bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_20px_-3px_rgba(139,92,246,0.45)] transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Connect Wallet</span>
          </button>
        )}
      </div>
    </header>
  );
}
