'use client';

import Link from 'next/link';
import { AlertCircle, ArrowLeft, Loader2, Wallet } from 'lucide-react';

type PipelineOpenStateProps =
  | { state?: 'loading' | 'studio' | 'sign-in'; message?: never }
  | { state: 'error'; message: string };

export function PipelineOpenState({ state = 'loading', message }: PipelineOpenStateProps) {
  const loading = state === 'loading' || state === 'studio';
  const Icon = loading ? Loader2 : state === 'sign-in' ? Wallet : AlertCircle;
  const title = state === 'studio' ? 'Loading Pipeline Studio…'
    : state === 'loading' ? 'Opening pipeline…'
    : state === 'sign-in' ? 'Sign in to open this pipeline'
    : 'Unable to open pipeline';
  const detail = state === 'sign-in' ? 'Use the sign-in button in the Workspace header.' : message;

  return (
    <div className="flex h-full min-h-[24rem] flex-col bg-[var(--ws-bg)]">
      {state !== 'studio' && (
        <div className="border-b border-[var(--ws-border)] bg-[var(--ws-rail)] px-4 py-2.5 sm:px-6">
          <Link href="/workspace/studio" className="ws-button">
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to pipelines
          </Link>
        </div>
      )}

      <div className="relative grid flex-1 place-items-center px-4 py-8">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,var(--ws-border)_1px,transparent_1px)] bg-[length:20px_20px]" />

        <section className="ws-panel relative w-full max-w-md p-5 sm:p-7">
          {loading && (
            <div aria-hidden="true" className="mb-6 flex items-center">
              {[0, 1, 2].map((index) => (
                <div key={index} className="flex min-w-0 flex-1 items-center last:flex-none last:basis-[28%]">
                  <div className="flex h-14 min-w-0 flex-1 flex-col justify-center gap-2 rounded-lg border border-[var(--ws-border)] bg-[var(--ws-rail)] px-2.5 sm:px-3">
                    <div className="h-1.5 w-3/4 rounded-full bg-[var(--ws-accent)] opacity-40" />
                    <div className="h-1.5 w-1/2 rounded-full bg-[var(--ws-border)]" />
                  </div>
                  {index < 2 && <div className="h-px w-3 shrink-0 bg-[var(--ws-accent)] opacity-40 sm:w-5" />}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-start gap-3" role={loading ? 'status' : state === 'error' ? 'alert' : undefined}>
            <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--ws-accent-bg)] text-[var(--ws-accent)]">
              <Icon aria-hidden="true" className={loading ? 'size-4 motion-safe:animate-spin' : 'size-4'} />
            </div>
            <div className="min-w-0 self-center">
              <h1 className="text-base font-semibold tracking-tight sm:text-lg">{title}</h1>
              {detail && <p className="mt-1 break-words text-sm leading-relaxed text-[var(--ws-muted)]">{detail}</p>}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
