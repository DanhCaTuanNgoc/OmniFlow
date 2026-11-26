'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Sparkles, X } from 'lucide-react';
import type { CopilotDraft } from '@omniflow/shared';
import { APP_CONFIG } from '@/lib/constants';
import { RECIPE_PRESETS } from '@/lib/recipes';

const examples = [
  ['Stop-Loss', 'Create a stop loss pipeline for ETH at $2,100'],
  ['Take-Profit', 'Sell 25% of my Vault ETH at $3,000 or higher'],
] as const;

export function CopilotDialog({ replacing, onApply, onClose }: {
  replacing: boolean;
  onApply: (draft: CopilotDraft) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const promptId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const promptInput = useRef<HTMLTextAreaElement>(null);
  const request = useRef<AbortController>();
  const [prompt, setPrompt] = useState('');
  const [proposal, setProposal] = useState<CopilotDraft>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    promptInput.current?.focus();
    return () => {
      request.current?.abort();
      element?.close();
    };
  }, []);

  function updatePrompt(value: string) {
    setPrompt(value);
    setProposal(undefined);
    setError('');
  }

  async function generate(event: FormEvent) {
    event.preventDefault();
    if (!prompt.trim() || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError('');
    setProposal(undefined);
    try {
      const response = await fetch(`${APP_CONFIG.backendUrl}/api/copilot/generate-graph`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || 'Studio AI is unavailable. Try again.');
      }
      setProposal(await response.json());
    } catch (failure) {
      if (!controller.signal.aborted) {
        setError(failure instanceof Error ? failure.message : 'Could not generate a draft. Try again.');
      }
    } finally {
      request.current = undefined;
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  const preset = proposal ? RECIPE_PRESETS[proposal.template] : undefined;
  const defaultPercent = preset?.nodes.find(node => node.type === 'dexSwap')?.data.amountPercentage;
  const pool = preset?.nodes.find(node => node.type === 'watchDEXPrice')?.data.pairLabel;

  return (
    <dialog ref={dialog} aria-labelledby={titleId}
      onCancel={event => { event.preventDefault(); onClose(); }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-xl border border-[var(--ws-border)] bg-[#111318] p-5 text-zinc-100 backdrop:bg-black/70 sm:p-7">
      <header className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 id={titleId} className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <Sparkles className="size-5 text-violet-300" aria-hidden="true" /> Create a pipeline with AI
          </h2>
          <p className="mt-1 text-sm text-zinc-300">Draft an ETH Stop-Loss or Take-Profit on Base Sepolia.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close AI dialog" className="ws-button p-2">
          <X className="size-4" aria-hidden="true" />
        </button>
      </header>
      <form onSubmit={generate} className="space-y-4" aria-busy={busy}>
        <div className="space-y-2">
          <label htmlFor={promptId} className="text-sm font-medium">Describe your automation</label>
          <textarea ref={promptInput} id={promptId} value={prompt} onChange={event => updatePrompt(event.target.value)}
            disabled={busy} maxLength={1000} rows={4} required
            placeholder={examples[0][1]}
            className="block w-full resize-y rounded-lg border border-[var(--ws-border)] bg-[#0a0b0f] p-3 text-sm placeholder:text-zinc-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-400" />
          <div className="flex flex-wrap gap-2">
            {examples.map(([label, example]) => (
              <button key={label} type="button" disabled={busy} onClick={() => updatePrompt(example)} className="ws-button text-xs">
                Try {label}
              </button>
            ))}
          </div>
        </div>
        {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
        {busy && <p role="status" className="text-sm text-zinc-300">Generating your draft…</p>}
        {proposal && preset && (
          <section aria-label="Draft preview" aria-live="polite" className="space-y-2 border-t border-[var(--ws-border)] pt-4">
            <h3 className="font-semibold">{preset.title}</h3>
            <p className="text-sm text-zinc-300 tabular-nums">
              Sell {proposal.sellPercent ?? String(defaultPercent)}% of Vault ETH
              {proposal.sellPercent === null ? ' (template default)' : ''} when ETH is
              {proposal.template === 'stop-loss' ? ' at or below ' : ' at or above '}${proposal.thresholdUsd}.
            </p>
            <p className="text-sm text-zinc-300">{String(pool)} template pool · Review pool and configure Vault in Studio.</p>
            {replacing && <p className="text-sm text-amber-200">Applying this draft replaces the current nodes and connections.</p>}
          </section>
        )}
        <footer className="flex flex-wrap justify-end gap-2">
          <button type="submit" className={proposal ? 'ws-button' : 'ws-button ws-button-primary'} disabled={busy || !prompt.trim()}>
            {proposal ? 'Regenerate' : 'Generate draft'}
          </button>
          {proposal && (
            <button type="button" className="ws-button ws-button-primary" onClick={() => onApply(proposal)}>
              {replacing ? 'Replace canvas' : 'Apply to canvas'}
            </button>
          )}
        </footer>
      </form>
    </dialog>
  );
}
