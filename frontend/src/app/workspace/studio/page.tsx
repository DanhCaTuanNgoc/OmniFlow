'use client';

import React, { Suspense, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import type { Address } from 'viem';
import { WorkspacePageHeader, WorkspaceState } from '@/components/common/WorkspaceUI';
import { listBrowserDrafts } from '@/lib/pipelineDraft';
import { workspaceRequest } from '@/lib/workspaceSession';

const StudioCanvas = dynamic(
  () => import('@/components/canvas/StudioCanvas').then((mod) => mod.StudioCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[#000000] select-none">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          <span className="text-xs font-mono text-[#8e8e8e]">Loading Pipeline Studio...</span>
        </div>
      </div>
    ),
  }
);

export default function StudioPage() {
  return <Suspense fallback={<WorkspaceState title="Loading Pipeline Studio…" />}><StudioRoute /></Suspense>;
}

function StudioRoute() {
  const params = useSearchParams();
  if (['new', 'recipe', 'pipeline', 'deployment', 'local'].some(key => params.has(key))) {
    return <div className="h-full w-full"><StudioCanvas /></div>;
  }
  return <StudioIndex />;
}

type DraftSummary = { id: string; name: string; updatedAt: number };

function StudioIndex() {
  const { address, isConnected } = useAccount();
  const [local, setLocal] = useState<DraftSummary[]>();
  const [localError, setLocalError] = useState(false);
  useEffect(() => {
    try {
      setLocal(listBrowserDrafts());
    } catch {
      setLocalError(true);
    }
  }, []);
  return (
    <div className="ws-page">
      <WorkspacePageHeader title="Pipeline Studio" description="Create a pipeline or reopen a saved draft."
        actions={<>
          <Link className="ws-button" href="/workspace/templates">Use a recipe</Link>
          <Link className="ws-button ws-button-primary" href="/workspace/studio?new=1">New pipeline</Link>
        </>} />
      {isConnected && address && <WalletDrafts key={address} owner={address} />}
      {localError && <p role="alert" className="text-sm text-rose-300">Browser drafts could not be read.</p>}
      {local && <DraftList title="Browser drafts" drafts={local} parameter="local" />}
    </div>
  );
}

function WalletDrafts({ owner }: { owner: Address }) {
  const [drafts, setDrafts] = useState<DraftSummary[]>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  async function load() {
    setPending(true);
    setError(undefined);
    try {
      const response = await workspaceRequest<{ drafts: DraftSummary[] }>(owner, '/pipeline/drafts');
      setDrafts(response.drafts);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to load the wallet drafts.');
    } finally {
      setPending(false);
    }
  }
  return <>
    <button type="button" className="ws-button self-start" disabled={pending} onClick={() => void load()}>
      {pending ? 'Loading drafts…' : drafts ? 'Refresh wallet drafts' : 'Load my pipelines'}
    </button>
    {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
    {drafts && <DraftList title="Wallet drafts" drafts={drafts} parameter="pipeline" />}
  </>;
}

function DraftList({ title, drafts, parameter }: { title: string; drafts: DraftSummary[]; parameter: 'local' | 'pipeline' }) {
  return (
    <section className="ws-panel space-y-2 p-4" aria-label={title}>
      <h2 className="font-semibold">{title}</h2>
      {drafts.length ? (
        <ul className="divide-y divide-[var(--ws-border)]">
          {drafts.map(draft => (
            <li key={draft.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <Link className="ws-address break-all" href={`/workspace/studio?${parameter}=${encodeURIComponent(draft.id)}`}>{draft.name}</Link>
              {draft.updatedAt > 0 && <time className="text-xs text-[var(--ws-muted)] tabular-nums"
                dateTime={new Date(draft.updatedAt).toISOString()}>{new Date(draft.updatedAt).toLocaleString()}</time>}
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-[var(--ws-muted)]">No drafts yet.</p>}
    </section>
  );
}
