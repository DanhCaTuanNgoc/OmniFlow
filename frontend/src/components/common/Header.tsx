'use client';

import React, { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { 
  Wallet, 
  ChevronDown, 
  LogOut, 
  Zap,
  Activity
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
    <header className="h-14 border-b border-[#1C142E] bg-[#06040A] px-5 flex items-center justify-between z-20 select-none">
      {/* Left Breadcrumb & Mode */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500">WORKSPACE</span>
          <span className="text-zinc-700">/</span>
          <span className="font-bold text-zinc-200 tracking-wider">PIPELINE STUDIO</span>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-none bg-[#110C1E] border border-[#2E1F4A] text-[#C084FC] text-[10px] font-mono tracking-wider uppercase">
          <span className="status-pip status-pip-violet" />
          <span>REACTIVE BUILDATHON LIVE RVM</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Active Chain Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-none bg-[#0B0813] border border-[#1C142E] text-xs font-mono">
          <span className="status-pip status-pip-emerald" />
          <span className="font-semibold text-zinc-300 uppercase tracking-wider">
            {chain?.name || 'Base Sepolia'}
          </span>
          <span className="text-[10px] text-zinc-500 tabular-nums">#84532</span>
        </div>

        {/* Wallet Button */}
        {isConnected && address ? (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 py-1.5 px-3 rounded-none bg-[#110C1E] hover:bg-[#171028] border border-[#2E1F4A] hover:border-[#8B5CF6] text-zinc-200 text-xs font-mono font-medium transition-colors cursor-pointer"
            >
              <span className="status-pip status-pip-emerald" />
              <span className="tabular-nums tracking-wide">{truncateAddress(address)}</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-48 rounded-none bg-[#0B0813] border border-[#2E1F4A] shadow-2xl py-1 text-xs font-mono text-zinc-300 z-50">
                <div className="px-3 py-2 border-b border-[#1C142E] text-[10px] text-zinc-500 uppercase tracking-widest flex items-center justify-between">
                  <span>METAMASK</span>
                  <span className="text-emerald-400">ACTIVE</span>
                </div>
                <button
                  onClick={() => {
                    disconnect();
                    setDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#16080E] hover:text-rose-400 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>DISCONNECT WALLET</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleConnect}
            className="flex items-center justify-center gap-2 px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider rounded-none border border-[#8B5CF6] bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-md shadow-[#8B5CF6]/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>CONNECT WALLET</span>
          </button>
        )}
      </div>
    </header>
  );
}
