'use client';

import { usePathname } from 'next/navigation';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { LogOut, Wallet } from 'lucide-react';
import { truncateAddress } from '@/lib/utils';

const sections: Record<string, string> = {
  studio: 'Pipeline Studio',
  active: 'Active Automations',
  templates: 'Template Library',
  vault: 'Vault Manager',
  logs: 'Activity Logs',
};

export function Header() {
  const pathname = usePathname();
  const title = sections[pathname.split('/')[2]] ?? 'Workspace';
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <header className="relative z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-[var(--ws-border)] bg-[var(--ws-rail)] px-3 sm:px-6">
      <div className="min-w-0 truncate text-xs font-semibold sm:text-sm">
        <span className="hidden text-[var(--ws-muted)] sm:inline">Workspace / </span>{title}
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {isConnected && chain && <span className="ws-badge hidden sm:inline-block">{chain.name}</span>}
        {isConnected && address ? (
          <details className="relative">
            <summary className="ws-button cursor-pointer list-none font-mono"><Wallet size={14} aria-hidden="true" />{truncateAddress(address)}</summary>
            <div className="ws-panel absolute right-0 top-full mt-2 w-48 p-2">
              {chain && <p className="px-2 py-1 text-xs text-[var(--ws-muted)]">{chain.name}</p>}
              <button type="button" onClick={() => disconnect()} className="ws-button w-full justify-start"><LogOut size={14} />Disconnect wallet</button>
            </div>
          </details>
        ) : (
          <button type="button" className="ws-button ws-button-primary" disabled={isPending || connectors.length === 0}
            onClick={() => { if (connectors[0]) connect({ connector: connectors[0] }); }}>
            {isPending ? 'Connecting...' : 'Connect wallet'}
          </button>
        )}
        {error && !isConnected && (
          <p role="alert" className="ws-panel absolute right-3 top-full mt-2 max-w-[16rem] p-3 text-xs text-rose-200">
            Could not connect the wallet. Check your wallet extension and try again.
          </p>
        )}
      </div>
    </header>
  );
}
