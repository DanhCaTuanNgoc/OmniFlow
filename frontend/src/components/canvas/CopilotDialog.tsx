'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { AlertCircle, ArrowDownRight, ArrowRight, ArrowUpRight, LoaderCircle, Sparkles, X } from 'lucide-react';
import type { CopilotDraft } from '@omniflow/shared';
import { isAddress, zeroAddress } from 'viem';
import { APP_CONFIG } from '@/lib/constants';
import { RECIPE_PRESETS } from '@/lib/recipes';

const examples = [
  ['Stop-Loss', 'Create a stop loss pipeline for ETH at $2,100'],
  ['Take-Profit', 'Sell 25% of my Vault ETH at $3,000 or higher'],
] as const;

export type ConfiguredCopilotDraft = CopilotDraft & {
  poolAddress: string;
  vaultAddress: string;
  cooldownSeconds: number;
};

export function CopilotDialog({ replacing, onApply, onClose }: {
  replacing: boolean;
  onApply: (draft: ConfiguredCopilotDraft) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const promptId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const promptInput = useRef<HTMLTextAreaElement>(null);
  const request = useRef<AbortController>();
  const [prompt, setPrompt] = useState('');
  const [proposal, setProposal] = useState<CopilotDraft>();
  const [poolAddress, setPoolAddress] = useState('');
  const [vaultAddress, setVaultAddress] = useState('');
  const [cooldown, setCooldown] = useState('');
  const [sellPercent, setSellPercent] = useState('');
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

  async function generate() {
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
      const draft: CopilotDraft = await response.json();
      const nodes = RECIPE_PRESETS[draft.template].nodes;
      setPoolAddress(String(nodes.find(node => node.type === 'watchDEXPrice')?.data.pairAddress ?? ''));
      setCooldown(String(nodes.find(node => node.type === 'cooldownGuard')?.data.cooldownSeconds ?? ''));
      setSellPercent(String(draft.sellPercent ?? nodes.find(node => node.type === 'dexSwap')?.data.amountPercentage ?? ''));
      setVaultAddress('');
      setProposal(draft);
    } catch (failure) {
      if (!controller.signal.aborted) {
        setError(failure instanceof Error ? failure.message : 'Could not generate a draft. Try again.');
      }
    } finally {
      request.current = undefined;
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  const isStopLoss = proposal?.template === 'stop-loss';
  const validAddress = (value: string) => isAddress(value) && value.toLowerCase() !== zeroAddress;

  function confirmDraft() {
    if (!proposal) return;
    const thresholdUsd = proposal.thresholdUsd.trim();
    if (!/^\d{1,8}(?:\.\d{1,6})?$/.test(thresholdUsd) || Number(thresholdUsd) <= 0) {
      setError('Enter a positive USD threshold with up to six decimal places.');
    } else if (!/^\d+$/.test(cooldown) || Number(cooldown) > 0xffffffff) {
      setError('Enter a whole cooldown from 0 to 4,294,967,295 seconds.');
    } else if (!/^\d+$/.test(sellPercent) || Number(sellPercent) < 1 || Number(sellPercent) > 100) {
      setError('Enter a whole sell percentage from 1 to 100.');
    } else if (!validAddress(poolAddress.trim()) || (vaultAddress.trim() && !validAddress(vaultAddress.trim()))) {
      setError('Enter a valid pool address and, if provided, a valid Vault address.');
    } else {
      onApply({ ...proposal, thresholdUsd, poolAddress: poolAddress.trim(), vaultAddress: vaultAddress.trim(),
        cooldownSeconds: Number(cooldown), sellPercent: Number(sellPercent) });
    }
  }

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
      <form onSubmit={event => {
        event.preventDefault();
        if (proposal) confirmDraft();
        else void generate();
      }} aria-busy={busy}>
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
          {busy && <p role="status" className="flex items-center gap-2 text-sm text-zinc-300"><LoaderCircle className="size-4 text-violet-300 motion-safe:animate-spin" aria-hidden="true" />Generating your draft…</p>}
          {proposal && (
            <section aria-label="Generated pipeline nodes" className="space-y-3 rounded-xl border border-[var(--ws-border)] bg-white/[.025] p-4">
              <h3 className="font-semibold">Review generated nodes</h3>
              <ol className="divide-y divide-[var(--ws-border)] text-sm">
                <li className="space-y-2 py-3">
                  <h4 className="font-medium text-sky-300">Watch DEX Price</h4>
                  <DraftField label="ETH / USDC pool on Base Sepolia" value={poolAddress} onChange={setPoolAddress} />
                </li>
                <li className="space-y-2 py-3">
                  <h4 className="font-medium text-amber-300">Price Threshold Guard</h4>
                  <DraftField label={isStopLoss ? 'Trigger at or below (USD)' : 'Trigger at or above (USD)'} value={proposal.thresholdUsd}
                    inputMode="decimal" onChange={thresholdUsd => setProposal({ ...proposal, thresholdUsd })} />
                </li>
                <li className="space-y-2 py-3">
                  <h4 className="font-medium text-amber-300">Cooldown Rate-Limiter</h4>
                  <DraftField label="Cooldown (seconds)" value={cooldown} inputMode="numeric" onChange={setCooldown} />
                </li>
                <li className="space-y-2 py-3">
                  <h4 className="font-medium text-emerald-300">DEX Token Swap</h4>
                  <DraftField label="Vault ETH to sell (%)" value={sellPercent} inputMode="numeric" onChange={setSellPercent} />
                  <DraftField label="Vault address (optional)" value={vaultAddress} onChange={setVaultAddress} />
                </li>
              </ol>
              {replacing && <p className="text-sm text-amber-200">Applying this draft replaces the current nodes and connections.</p>}
            </section>
          )}
          {error && <p role="alert" className="flex items-start gap-2 rounded-lg bg-rose-500/10 px-3 py-2.5 text-sm text-rose-200"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{error}</p>}
        </div>
        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--ws-border)] px-5 py-4 sm:px-7">
          <button type="button" className="ws-button mr-auto" onClick={onClose}>Cancel</button>
          <button type={proposal ? 'button' : 'submit'} onClick={proposal ? generate : undefined}
            className={proposal ? 'ws-button' : 'ws-button ws-button-primary inline-flex items-center gap-2'} disabled={busy || !prompt.trim()}>
            {!proposal && <Sparkles className="size-4" aria-hidden="true" />}
            {busy ? 'Generating…' : proposal ? 'Regenerate' : 'Generate draft'}
          </button>
          {proposal && (
            <button type="submit" className="ws-button ws-button-primary inline-flex items-center gap-2">
              {replacing ? 'Confirm and replace canvas' : 'Confirm and load graph'}
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          )}
        </footer>
      </form>
    </dialog>
  );
}

function DraftField({ label, value, onChange, inputMode }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: 'decimal' | 'numeric';
}) {
  return (
    <label className="block space-y-1 text-xs text-zinc-300">
      <span>{label}</span>
      <input value={value} inputMode={inputMode} onChange={event => onChange(event.target.value)}
        className="block w-full rounded-md border border-[var(--ws-border)] bg-black/25 px-3 py-2 text-sm tabular-nums text-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-400" />
    </label>
  );
}
