'use client';

import { useState, useSyncExternalStore } from 'react';
import { useAccount } from 'wagmi';
import type { Address } from 'viem';
import {
  connectAndSignInToWorkspace, getWorkspaceSessionToken, subscribeToWorkspaceSession,
  WorkspaceWalletPromptCancelled,
} from '@/lib/workspaceSession';

export function useWorkspaceSignedIn(owner?: Address) {
  return useSyncExternalStore(subscribeToWorkspaceSession,
    () => Boolean(owner && getWorkspaceSessionToken(owner)), () => false);
}

export function WorkspaceSignIn({ compact = false }: { compact?: boolean }) {
  const { isConnected, status } = useAccount();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const label = isConnected ? 'Sign in to workspace' : 'Connect & sign in';

  async function handleSignIn() {
    setPending(true);
    setError(undefined);
    try {
      await connectAndSignInToWorkspace();
    } catch (failure) {
      if (!(failure instanceof WorkspaceWalletPromptCancelled)) {
        setError('Sign-in did not complete. Check MetaMask and try again.');
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={compact ? 'relative' : 'space-y-2'}>
      {!compact && <p className="text-sm text-[var(--ws-muted)]">
        {isConnected ? 'Sign one message in MetaMask to access your wallet workspace.'
          : 'Connect MetaMask and sign one message to access your wallet workspace.'}
      </p>}
      <button type="button" className="ws-button" disabled={pending || status === 'reconnecting'}
        onClick={() => void handleSignIn()}>
        {pending ? 'Signing in...' : label}
      </button>
      {error && <p role="alert" className={compact
        ? 'ws-panel absolute right-0 top-full z-20 mt-2 w-64 p-3 text-xs text-rose-300'
        : 'text-sm text-rose-300'}>{error}</p>}
    </div>
  );
}
