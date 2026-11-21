'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useSwitchChain } from 'wagmi';
import { baseSepoliaChain } from '@/lib/chains';
import {
  getWorkspaceWalletPrompt,
  subscribeToWorkspaceWalletPrompt,
} from '@/lib/workspaceSession';

export function WorkspaceWalletModal() {
  const prompt = useSyncExternalStore(subscribeToWorkspaceWalletPrompt, getWorkspaceWalletPrompt, () => null);

  return prompt ? <WalletDialog key={String(prompt.canSwitch)} prompt={prompt} /> : null;
}

function WalletDialog({ prompt }: { prompt: NonNullable<ReturnType<typeof getWorkspaceWalletPrompt>> }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { switchChainAsync, isPending } = useSwitchChain();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  async function switchToBaseSepolia() {
    setFailed(false);
    try {
      await switchChainAsync({ chainId: baseSepoliaChain.id });
      prompt.finish(true);
    } catch {
      setFailed(true);
    }
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby="workspace-wallet-title"
      aria-describedby="workspace-wallet-description"
      onCancel={(event) => { event.preventDefault(); prompt.finish(false); }}
      className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6 text-white shadow-xl backdrop:bg-black/70"
    >
      <h2 id="workspace-wallet-title" className="text-lg font-semibold">
        {prompt.canSwitch ? 'Switch to Base Sepolia' : 'Connect your deployment wallet'}
      </h2>
      <p id="workspace-wallet-description" className="mt-2 text-sm text-zinc-300">
        {prompt.canSwitch
          ? 'Switch networks in your wallet to continue signing in to OmniFlow.'
          : 'Select the wallet used for this deployment in your wallet or from the Workspace header, then try again.'}
      </p>
      {failed && (
        <p role="alert" className="mt-3 text-sm text-rose-300">
          The network switch did not complete. Confirm Base Sepolia in your wallet and try again.
        </p>
      )}
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button type="button" autoFocus onClick={() => prompt.finish(false)} className="rounded-md border border-zinc-600 px-3 py-2 text-sm hover:bg-zinc-800">
          Cancel
        </button>
        {prompt.canSwitch && (
          <button type="button" disabled={isPending} onClick={switchToBaseSepolia} className="rounded-md bg-violet-400 px-3 py-2 text-sm font-semibold text-zinc-950 hover:bg-violet-300 disabled:opacity-60">
            {isPending ? 'Switching…' : 'Switch to Base Sepolia'}
          </button>
        )}
      </div>
    </dialog>
  );
}
