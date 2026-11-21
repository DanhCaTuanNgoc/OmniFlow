'use client';

import { useId, useState, useSyncExternalStore } from 'react';
import { Loader2, Wallet } from 'lucide-react';
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
  const titleId = useId();
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

  const button = (
    <button type="button" className={compact ? 'ws-button ws-button-primary whitespace-nowrap'
      : 'ws-button ws-button-primary w-full sm:w-auto sm:min-w-[12rem]'}
      disabled={pending || status === 'reconnecting'}
      onClick={() => void handleSignIn()}>
      {!compact && (pending
        ? <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />
        : <Wallet aria-hidden="true" className="size-4" />)}
      {pending ? 'Signing in...' : label}
    </button>
  );

  if (compact) {
    return <div className="relative">
      {button}
      {error && <p role="alert" className="ws-panel absolute right-0 top-full z-20 mt-2 w-64 p-3 text-xs text-rose-300">{error}</p>}
    </div>;
  }

  return (
    <div className="ws-sign-in">
      <section aria-labelledby={titleId} className="ws-panel flex w-full max-w-sm flex-col items-center gap-5 p-6 text-center sm:p-8">
        <div className="space-y-2">
          <h2 id={titleId} className="text-xl font-semibold tracking-tight">{isConnected ? 'Sign in to OmniFlow' : 'Connect your wallet'}</h2>
          <p className="text-sm leading-relaxed text-[var(--ws-muted)]">
            {isConnected ? 'Sign a message in MetaMask to open your workspace.'
              : 'Use MetaMask to connect and sign in to OmniFlow.'}
          </p>
        </div>
        {button}
        {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
      </section>
    </div>
  );
}
