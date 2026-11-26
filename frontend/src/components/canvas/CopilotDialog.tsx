'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { AlertCircle, ArrowDownRight, ArrowRight, ArrowUpRight, LoaderCircle, Sparkles, X } from 'lucide-react';
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
  const isStopLoss = proposal?.template === 'stop-loss';
  const threshold = proposal && new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 6,
  }).format(Number(proposal.thresholdUsd));

  return (
    <dialog ref={dialog} aria-labelledby={titleId}
      onCancel={event => { event.preventDefault(); onClose(); }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-[var(--ws-border)] bg-[#111318] p-0 text-zinc-100 backdrop:bg-black/75">
      <header className="flex items-start gap-3 border-b border-[var(--ws-border)] bg-[linear-gradient(110deg,rgba(139,92,246,.16),transparent_75%)] px-5 py-5 sm:gap-4 sm:px-7">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-500/15 text-violet-200" aria-hidden="true">
          <Sparkles className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="text-lg font-semibold tracking-tight sm:text-xl">Create a pipeline with AI</h2>
          <p className="mt-1 text-sm leading-relaxed text-zinc-300">Draft an ETH Stop-Loss or Take-Profit on Base Sepolia.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close AI dialog" className="grid size-9 shrink-0 place-items-center rounded-lg text-zinc-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-400">
          <X className="size-4" aria-hidden="true" />
        </button>
      </header>
      <form onSubmit={generate} aria-busy={busy}>
        <div className="space-y-4 px-5 py-5 sm:px-7">
          <div className="space-y-2.5">
            <label htmlFor={promptId} className="text-sm font-medium">Describe your automation</label>
            <div className="rounded-xl border border-[var(--ws-border)] bg-black/25 focus-within:border-violet-400">
              <textarea ref={promptInput} id={promptId} value={prompt} onChange={event => updatePrompt(event.target.value)}
                disabled={busy} maxLength={1000} rows={4} required
                placeholder={examples[0][1]}
                className="block w-full resize-y rounded-t-xl bg-transparent px-4 pt-3 text-sm leading-relaxed caret-violet-300 outline-none placeholder:text-zinc-400" />
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 pb-3 pt-2">
                <div className="flex flex-wrap gap-2">
                  {examples.map(([label, example], index) => {
                    const Icon = index === 0 ? ArrowDownRight : ArrowUpRight;
                    return (
                      <button key={label} type="button" disabled={busy} onClick={() => { updatePrompt(example); promptInput.current?.focus(); }}
                        className="ws-button inline-flex items-center gap-1.5 text-xs">
                        <Icon className="size-3.5 text-violet-300" aria-hidden="true" />
                        {label}
                      </button>
                    );
                  })}
                </div>
                <span className="text-xs tabular-nums text-zinc-400">{prompt.length} / 1,000</span>
              </div>
            </div>
          </div>
          {error && <p role="alert" className="flex items-start gap-2 rounded-lg bg-rose-500/10 px-3 py-2.5 text-sm text-rose-200"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{error}</p>}
          {busy && <p role="status" className="flex items-center gap-2 text-sm text-zinc-300"><LoaderCircle className="size-4 text-violet-300 motion-safe:animate-spin" aria-hidden="true" />Generating your draft…</p>}
          {proposal && preset && (
            <section aria-label="Draft preview" aria-live="polite" className="space-y-3 rounded-xl border border-[var(--ws-border)] bg-white/[.025] p-4">
              <h3 className="font-semibold">{preset.title}</h3>
              <dl className="grid gap-3 border-y border-[var(--ws-border)] py-3 text-sm sm:grid-cols-3">
                <div><dt className="text-zinc-400">Trigger price</dt><dd className="mt-1 font-medium tabular-nums text-violet-200">{isStopLoss ? '≤' : '≥'} {threshold}</dd></div>
                <div><dt className="text-zinc-400">Sell from Vault</dt><dd className="mt-1 font-medium tabular-nums">{proposal.sellPercent ?? String(defaultPercent)}% ETH {proposal.sellPercent === null && <span className="text-xs font-normal text-zinc-400">(default)</span>}</dd></div>
                <div><dt className="text-zinc-400">Template pool</dt><dd className="mt-1 font-medium">{String(pool)}</dd></div>
              </dl>
              <p className="text-sm text-zinc-300">Review the pool and configure your Vault in Studio.</p>
              {replacing && <p className="text-sm text-amber-200">Applying this draft replaces the current nodes and connections.</p>}
            </section>
          )}
        </div>
        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--ws-border)] px-5 py-4 sm:px-7">
          <button type="button" className="ws-button mr-auto" onClick={onClose}>Cancel</button>
          <button type="submit" className={proposal ? 'ws-button' : 'ws-button ws-button-primary inline-flex items-center gap-2'} disabled={busy || !prompt.trim()}>
            {!proposal && <Sparkles className="size-4" aria-hidden="true" />}
            {busy ? 'Generating…' : proposal ? 'Regenerate' : 'Generate draft'}
          </button>
          {proposal && (
            <button type="button" className="ws-button ws-button-primary inline-flex items-center gap-2" onClick={() => onApply(proposal)}>
              {replacing ? 'Replace canvas' : 'Apply to canvas'}
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          )}
        </footer>
      </form>
    </dialog>
  );
}
