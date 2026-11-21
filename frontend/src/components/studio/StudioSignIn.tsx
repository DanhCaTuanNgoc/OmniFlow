'use client';

import { useState } from 'react';
import type { Address } from 'viem';
import { signInToWorkspace, WorkspaceWalletPromptCancelled } from '@/lib/workspaceSession';

export function StudioSignIn({ owner, onSignedIn }: { owner: Address; onSignedIn: () => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function handleSignIn() {
    setPending(true);
    setError(undefined);
    try {
      await signInToWorkspace(owner);
      onSignedIn();
    } catch (failure) {
      if (!(failure instanceof WorkspaceWalletPromptCancelled)) {
        setError('Sign-in did not complete. Check MetaMask and try again.');
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-[var(--ws-muted)]">Sign in to view pipelines saved to your wallet. MetaMask will ask you to sign a message.</p>
      <button type="button" className="ws-button" disabled={pending} onClick={() => void handleSignIn()}>
        {pending ? 'Signing in...' : 'Sign in to workspace'}
      </button>
      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
    </div>
  );
}
