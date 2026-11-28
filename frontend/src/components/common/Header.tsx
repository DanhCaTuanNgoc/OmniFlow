'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount, useDisconnect, useSwitchChain } from 'wagmi';
import { ArrowLeftRight, LogOut, Wallet, Pencil, AlertTriangle } from 'lucide-react';
import { baseSepoliaChain } from '@/lib/chains';
import { isDuplicatePipelineName } from '@/lib/pipelineDraft';
import { truncateAddress } from '@/lib/utils';
import { useStudioHeaderStore } from '@/lib/studioHeaderStore';
import { clearWorkspaceSession } from '@/lib/workspaceSession';
import { useWorkspaceSignedIn, WorkspaceSignIn } from './WorkspaceSignIn';

const sections: Record<string, string> = {
  studio: 'Pipeline Studio',
  active: 'Active Automations',
  templates: 'Template Library',
  vault: 'Vault Manager',
  logs: 'Activity Logs',
};

export function Header() {
  const pathname = usePathname();
  const pathSegments = pathname.split('/');
  const sectionKey = pathSegments[2];
  const subRoute = pathSegments[3];
  const title = sections[sectionKey] ?? 'Workspace';
  const { address, isConnected, chain, chainId } = useAccount();
  const signedIn = useWorkspaceSignedIn(isConnected ? address : undefined);
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching, isError: switchFailed } = useSwitchChain();
  const needsBaseSepolia = isConnected && chainId !== baseSepoliaChain.id;

  const { pipelineName, isEditable, existingPipelineNames, onRename, activeAutomationName } = useStudioHeaderStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const isStudioDetail = sectionKey === 'studio' && Boolean(pipelineName);
  const isActiveDetail = sectionKey === 'active' && Boolean(subRoute) && Boolean(activeAutomationName);
  const trimmedEditValue = editValue.trim();
  const isDuplicateEditName =
    isStudioDetail &&
    isEditing &&
    Boolean(trimmedEditValue) &&
    isDuplicatePipelineName(trimmedEditValue, existingPipelineNames);
  const parentBreadcrumb = isStudioDetail
    ? { href: '/workspace/studio', label: 'Pipeline Studio', title: 'Return to Pipeline Studio Hub' }
    : isActiveDetail
    ? { href: '/workspace/active', label: 'Active Automations', title: 'Return to Active Automations' }
    : null;

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
        <span className="hidden text-[var(--ws-muted)] sm:inline">Workspace / </span>
        {parentBreadcrumb ? (
          <>
            <Link
              href={parentBreadcrumb.href}
              className="text-[var(--ws-muted)] hover:text-white transition-colors shrink-0"
              title={parentBreadcrumb.title}
            >
              {parentBreadcrumb.label}
            </Link>
            <span className="text-[var(--ws-muted)]">/</span>
            {isStudioDetail ? (
              isEditing ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={handleCommitEdit}
                  onKeyDown={handleKeyDown}
                  maxLength={120}
                  className="rounded border border-[var(--ws-accent)] bg-[#0d0e15] px-2 py-0.5 text-xs text-white font-medium focus:outline-none max-w-[14rem] sm:max-w-[20rem]"
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
              )
            ) : (
              <span className="truncate font-medium text-white">{activeAutomationName}</span>
            )}
          </>
        ) : (
          <span>{title}</span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {isConnected && chain && <span className="ws-badge hidden sm:inline-block">{chain.name}</span>}
        {needsBaseSepolia && (
          <button
            type="button"
            className="ws-button border-amber-400/40 text-amber-200 hover:border-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300"
            aria-label={isSwitching ? 'Switching to Base Sepolia' : 'Switch to Base Sepolia'}
            title="Switch to Base Sepolia"
            disabled={isSwitching}
            onClick={() => switchChain({ chainId: baseSepoliaChain.id })}
          >
            <ArrowLeftRight size={14} aria-hidden="true" />
            <span className="sm:hidden">{isSwitching ? 'Switching…' : 'Switch'}</span>
            <span className="hidden sm:inline">{isSwitching ? 'Switching…' : 'Switch to Base Sepolia'}</span>
          </button>
        )}
        {isConnected && address ? (
          <details className="relative">
            <summary className="ws-button cursor-pointer list-none font-mono">
              <Wallet size={14} aria-hidden="true" />
              {truncateAddress(address)}
            </summary>
            <div className="ws-panel absolute right-0 top-full mt-2 w-48 p-2">
              {chain && <p className="px-2 py-1 text-xs text-[var(--ws-muted)]">{chain.name}</p>}
              <p className="px-2 py-1 text-xs text-[var(--ws-muted)]">{signedIn ? 'Workspace signed in' : 'Wallet connected'}</p>
              <button type="button" onClick={() => { clearWorkspaceSession(); disconnect(); }} className="ws-button w-full justify-start">
                <LogOut size={14} />Disconnect wallet
              </button>
            </div>
          </details>
        ) : null}
        {!signedIn && <WorkspaceSignIn compact />}
        {isDuplicateEditName && (
          <div
            role="status"
            className="absolute left-3 top-full z-40 mt-2 flex max-w-[calc(100vw-1.5rem)] items-start gap-2 rounded-lg border border-amber-500/35 bg-[#211e1a] px-3 py-2 text-[11px] leading-relaxed text-amber-200 sm:left-6 sm:max-w-md"
          >
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-400" aria-hidden="true" />
            <span>
              Another pipeline is already named <strong className="font-semibold text-amber-100">&ldquo;{trimmedEditValue}&rdquo;</strong>. You can keep it, though identical names may be harder to distinguish.
            </span>
          </div>
        )}
        {needsBaseSepolia && switchFailed && (
          <p role="alert" className="ws-panel absolute right-3 top-full mt-2 max-w-[16rem] p-3 text-xs text-rose-200">
            Could not switch to Base Sepolia. Check your wallet and try again.
          </p>
        )}
      </div>
    </header>
  );
}
