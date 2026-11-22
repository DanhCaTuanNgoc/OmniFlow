'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { AlertCircle, Rocket, ShieldCheck, X } from 'lucide-react';
import type { Address } from 'viem';
import { truncateAddress } from '@/lib/utils';

export function DeployDialog({
  children,
  error,
  busy,
  title = 'Deploy Reactive Automation',
  subtitle = 'Autonomous execution on Reactive Lasna Testnet (Chain ID: 5318007)',
  icon,
  onClose,
}: {
  children: ReactNode;
  error?: string | null;
  busy?: boolean;
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  onClose: () => void;
}) {
  const titleId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
    return () => { if (element?.open) element.close(); };
  }, []);

  return (
    <dialog ref={dialog} aria-labelledby={titleId}
      onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
      onClick={event => {
        if (busy || event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right ||
            event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg space-y-4 overflow-y-auto rounded-xl border border-[var(--ws-border)] bg-[#191c24] p-5 text-[var(--ws-text)] shadow-2xl backdrop:bg-black/80 backdrop:backdrop-blur-sm">
      <header className="flex items-center justify-between gap-3 border-b border-[var(--ws-border)] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-[var(--ws-accent)]/20 bg-[var(--ws-accent-bg)] text-[var(--ws-accent)]">
            {icon ?? <Rocket aria-hidden="true" className="size-4" />}
          </div>
          <div>
            <h2 id={titleId} className="text-sm font-semibold tracking-tight text-white">{title}</h2>
            {subtitle && <p className="text-xs text-[var(--ws-muted)]">{subtitle}</p>}
          </div>
        </div>
        <button type="button" onClick={onClose} disabled={busy} aria-label="Close deploy dialog"
          className="rounded p-1 text-[var(--ws-muted)] transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50">
          <X aria-hidden="true" className="size-4" />
        </button>
      </header>
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
          <AlertCircle aria-hidden="true" className="size-4 shrink-0 text-rose-400" />
          <span className="break-words leading-relaxed">{error}</span>
        </div>
      )}
      {children}
    </dialog>
  );
}

export function DeploySummary({ nodes, edges, trigger, execution, vault, vaultLabel = 'Action Vault', funding, gas, owner, notice }: {
  nodes: number;
  edges: number;
  trigger: ReactNode;
  execution: ReactNode;
  vault: Address;
  vaultLabel?: string;
  funding: ReactNode;
  gas?: ReactNode;
  owner?: Address;
  notice: ReactNode;
}) {
  return (
    <>
      <div className="space-y-2.5 rounded-lg border border-[var(--ws-border)] bg-[#111318] p-3.5 text-xs">
        <div className="flex items-center justify-between gap-2 border-b border-[var(--ws-border)] pb-2">
          <span className="font-medium text-[var(--ws-muted)]">Pipeline Structure</span>
          <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-white tabular-nums">
            {nodes} {nodes === 1 ? 'Node' : 'Nodes'} &bull; {edges} {edges === 1 ? 'Edge' : 'Edges'}
          </span>
        </div>
        <dl className="space-y-2">
          <SummaryRow label="Trigger Condition">{trigger}</SummaryRow>
          <SummaryRow label="Execution Logic">{execution}</SummaryRow>
          <SummaryRow label={vaultLabel}><span className="font-mono text-[11px]" title={vault}>{truncateAddress(vault)}</span></SummaryRow>
          <SummaryRow label="Initial RSC Funding">{funding}</SummaryRow>
          {gas && <SummaryRow label="Estimated deployment gas">{gas}</SummaryRow>}
          <div className="border-t border-[var(--ws-border)]/60 pt-1.5">
            <SummaryRow label="Owner Signer">
              <span className="font-mono text-[11px] font-semibold text-[var(--ws-accent)]" title={owner}>
                {owner ? truncateAddress(owner) : 'Connect wallet'}
              </span>
            </SummaryRow>
          </div>
        </dl>
      </div>
      <p className="flex items-start gap-2.5 rounded-lg border border-[var(--ws-accent)]/20 bg-[var(--ws-accent-bg)]/30 p-3 text-[11px] leading-relaxed text-zinc-300">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--ws-accent)]" />
        <span>{notice}</span>
      </p>
    </>
  );
}

function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[var(--ws-muted)]">{label}</dt>
      <dd className="text-right font-medium text-white tabular-nums">{children}</dd>
    </div>
  );
}
