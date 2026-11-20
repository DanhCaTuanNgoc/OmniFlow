'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { LogOut, Wallet, Pencil } from 'lucide-react';
import { truncateAddress } from '@/lib/utils';
import { useStudioHeaderStore } from '@/lib/studioHeaderStore';

const sections: Record<string, string> = {
  studio: 'Pipeline Studio',
  active: 'Active Automations',
  templates: 'Template Library',
  vault: 'Vault Manager',
  logs: 'Activity Logs',
};

export function Header() {
  const pathname = usePathname();
  const sectionKey = pathname.split('/')[2];
  const title = sections[sectionKey] ?? 'Workspace';
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();

  const { pipelineName, isEditable, onRename } = useStudioHeaderStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const isStudioDetail = sectionKey === 'studio' && Boolean(pipelineName);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    if (!isEditable) return;
    setEditValue(pipelineName);
    setIsEditing(true);
  };

  const handleCommitEdit = () => {
    setIsEditing(false);
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== pipelineName) {
      onRename?.(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommitEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  return (
    <header className="relative z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-[var(--ws-border)] bg-[var(--ws-rail)] px-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-1.5 truncate text-xs font-semibold sm:text-sm">
        {isStudioDetail ? (
          <>
            <span className="hidden text-[var(--ws-muted)] sm:inline">Workspace / </span>
            <Link
              href="/workspace/studio"
              className="text-[var(--ws-muted)] hover:text-white transition-colors shrink-0"
              title="Return to Pipeline Studio Hub"
            >
              Pipeline Studio
            </Link>
            <span className="text-[var(--ws-muted)]">/</span>
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleCommitEdit}
                onKeyDown={handleKeyDown}
                maxLength={120}
                className="rounded border border-[var(--ws-accent)] bg-[#0d0e15] px-2 py-0.5 text-xs text-white font-medium focus:outline-none focus:ring-1 focus:ring-[var(--ws-accent)] max-w-[14rem] sm:max-w-[20rem]"
              />
            ) : (
              <button
                type="button"
                onClick={handleStartEdit}
                disabled={!isEditable}
                title={isEditable ? 'Click to rename pipeline' : undefined}
                className={`group inline-flex items-center gap-1.5 truncate rounded px-1.5 py-0.5 font-medium transition-colors ${
                  isEditable
                    ? 'cursor-pointer text-white hover:bg-white/10 hover:text-[var(--ws-accent)]'
                    : 'text-white'
                }`}
              >
                <span className="truncate">{pipelineName}</span>
                {isEditable && (
                  <Pencil className="size-3 text-zinc-400 opacity-60 group-hover:opacity-100 group-hover:text-[var(--ws-accent)] transition-opacity shrink-0" />
                )}
              </button>
            )}
          </>
        ) : (
          <>
            <span className="hidden text-[var(--ws-muted)] sm:inline">Workspace / </span>
            <span>{title}</span>
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {isConnected && chain && <span className="ws-badge hidden sm:inline-block">{chain.name}</span>}
        {isConnected && address ? (
          <details className="relative">
            <summary className="ws-button cursor-pointer list-none font-mono">
              <Wallet size={14} aria-hidden="true" />
              {truncateAddress(address)}
            </summary>
            <div className="ws-panel absolute right-0 top-full mt-2 w-48 p-2">
              {chain && <p className="px-2 py-1 text-xs text-[var(--ws-muted)]">{chain.name}</p>}
              <button type="button" onClick={() => disconnect()} className="ws-button w-full justify-start">
                <LogOut size={14} />Disconnect wallet
              </button>
            </div>
          </details>
        ) : (
          <button
            type="button"
            className="ws-button ws-button-primary"
            disabled={isPending || connectors.length === 0}
            onClick={() => {
              if (connectors[0]) connect({ connector: connectors[0] });
            }}
          >
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
