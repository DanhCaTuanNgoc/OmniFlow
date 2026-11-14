'use client';

import React, { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { 
  Wallet, 
  ChevronDown, 
  LogOut, 
  Sparkles,
  Layers
} from 'lucide-react';
import { truncateAddress } from '@/lib/utils';

export function Header() {
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
    <header className="h-16 border-b border-[#2E1E54]/60 bg-[#0D0819]/80 backdrop-blur-md px-6 flex items-center justify-between z-20 select-none">
      {/* Left Breadcrumb & Mode */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="text-purple-300/60">Workspace</span>
          <span className="text-purple-400/40">/</span>
          <span className="font-semibold text-white">Pipeline Studio</span>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/40 border border-purple-800/40 text-purple-300 text-[11px] font-medium shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
          <span>Reactive Omni Live Testnet</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Active Chain Pill */}
        <div className="hidden md:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#150E28] border border-purple-900/40 text-xs">
          <span className="status-dot status-dot-emerald" />
          <span className="font-medium text-slate-200">
            {chain?.name || 'Base Sepolia'}
          </span>
          <span className="text-[11px] font-mono text-purple-400/80 tabular-nums">#84532</span>
        </div>

        {/* Wallet Button */}
        {isConnected && address ? (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 py-1.5 px-4 rounded-full bg-[#150E28] hover:bg-[#1E1438] border border-purple-800/40 hover:border-purple-500/50 text-slate-100 text-xs font-mono font-medium transition-all shadow-sm cursor-pointer"
            >
              <span className="status-dot status-dot-emerald" />
              <span className="tabular-nums tracking-wide">{truncateAddress(address)}</span>
              <ChevronDown className="w-3.5 h-3.5 text-purple-300" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#130D24] border border-purple-900/60 shadow-2xl py-1.5 text-xs text-slate-200 z-50 backdrop-blur-xl">
                <div className="px-3.5 py-2 border-b border-purple-900/40 text-[11px] text-purple-300/80 flex items-center justify-between font-medium">
                  <span>MetaMask Connected</span>
                  <span className="text-emerald-400 text-[10px]">Active</span>
                </div>
                <button
                  onClick={() => {
                    disconnect();
                    setDropdownOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-rose-950/40 hover:text-rose-300 flex items-center gap-2.5 transition-colors cursor-pointer text-slate-300"
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
            className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Connect Wallet</span>
          </button>
        )}
      </div>
    </header>
  );
}
