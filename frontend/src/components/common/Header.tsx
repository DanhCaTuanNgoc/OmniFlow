'use client';

import React, { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { 
  Wallet, 
  ChevronDown, 
  LogOut, 
  ShieldCheck, 
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
    <header className="h-16 border-b border-slate-800 bg-[#0B1120] px-6 flex items-center justify-between z-20 select-none">
      {/* Left Breadcrumb & Mode */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="text-slate-500">Workspace</span>
          <span>/</span>
          <span className="font-semibold text-slate-200">Pipeline Studio</span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/40 border border-cyan-800/60 text-cyan-400 text-[11px] font-mono">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          Reactive Buildathon Live Testnet
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Active Chain Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium text-slate-300">
            {chain?.name || 'Base Sepolia'}
          </span>
          <span className="font-mono text-[10px] text-slate-500">#84532</span>
        </div>

        {/* Wallet Button */}
        {isConnected && address ? (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-100 text-xs font-mono font-medium transition-colors"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{truncateAddress(address)}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-xl py-1 text-xs text-slate-300 z-50">
                <div className="px-3 py-2 border-b border-slate-800 text-[11px] text-slate-400">
                  Connected with MetaMask
                </div>
                <button
                  onClick={() => {
                    disconnect();
                    setDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800 hover:text-red-400 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Disconnect Wallet
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleConnect}
            className="flex items-center gap-2 py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-slate-100 text-xs font-semibold transition-all shadow-md shadow-blue-500/20"
          >
            <Wallet className="w-3.5 h-3.5" />
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  );
}
