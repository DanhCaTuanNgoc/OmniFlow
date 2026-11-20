'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import type { Address } from 'viem';
import { WorkspacePageHeader, WorkspaceState } from '@/components/common/WorkspaceUI';
import { useWebSocket, WebSocketProvider } from '@/components/providers/WebSocketProvider';
import { getWorkspaceSessionToken, workspaceRequest } from '@/lib/workspaceSession';

export type Execution = {
  id: string;
  pipelineId: string;
  pipelineName: string;
  timestamp: string;
  status: 'PENDING' | 'UNVERIFIED' | 'REORGED' | 'SUCCESS' | 'SKIPPED' | 'FAILED';
  originTxHash: string;
  reactiveTxHash?: string;
  destinationTxHash?: string;
  details: { reason?: string };
};

const outcome = {
  PENDING: 'Pending confirmation', UNVERIFIED: 'Reconciling receipts', REORGED: 'Reorganized',
  SUCCESS: 'Executed', SKIPPED: 'Skipped', FAILED: 'Failed',
};

type History = { logs: Execution[]; indexer: { checkedAt: string; error: boolean } | null;
  next: { timestamp: string; sequence: number } | null };

export default function ActivityLogsPage() {
  return <Suspense fallback={<WorkspaceState title="Loading Activity Logs…" />}><LogsRoute /></Suspense>;
}

function LogsRoute() {
  const { address, isConnected } = useAccount();
  const id = useSearchParams().get('deployment');
  return (
    <div className="ws-page">
      <WorkspacePageHeader title="Activity Logs" description="Follow source events, Reactive requests and verified destination receipts." />
      {isConnected && address ? (
        <WebSocketProvider key={`${address}:${id ?? 'all'}`}>
          <WalletHistory owner={address} deploymentId={id} />
        </WebSocketProvider>
      ) : <WorkspaceState title="Connect a wallet to view your activity." />}
    </div>
  );
}

function WalletHistory({ owner, deploymentId }: { owner: Address; deploymentId: string | null }) {
  const [history, setHistory] = useState<History>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const { addListener, sendMessage, status } = useWebSocket();
  const path = deploymentId ? `/logs?pipelineId=${encodeURIComponent(deploymentId)}` : '/logs';

  const load = useCallback(async () => {
    setPending(true);
    setError(undefined);
    try {
      setHistory(await workspaceRequest<History>(owner, path));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to open activity.');
    } finally {
      setPending(false);
    }
  }, [owner, path]);

  const hasHistory = history !== undefined;
  async function loadEarlier() {
    const next = history?.next;
    if (!next) return;
    setPending(true);
    setError(undefined);
    try {
      const params = new URLSearchParams({ before: next.timestamp, sequence: String(next.sequence) });
      const page = await workspaceRequest<History>(owner, `${path}${deploymentId ? '&' : '?'}${params}`);
      setHistory(current => current && {
        ...page,
        logs: [...current.logs, ...page.logs.filter(entry => !current.logs.some(currentEntry => currentEntry.id === entry.id))],
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to load earlier receipts.');
    } finally {
      setPending(false);
    }
  }
  useEffect(() => {
    if (status !== 'CONNECTED' || !hasHistory || !deploymentId) return;
    const token = getWorkspaceSessionToken(owner);
    if (!token) return;
    const remove = addListener(message => {
      if (getWorkspaceSessionToken(owner) !== token) return;
      if (message.type === 'AUTHENTICATED') {
        sendMessage({ type: 'SUBSCRIBE_PIPELINE', pipelineId: deploymentId });
      } else if (message.type === 'PIPELINE_STATUS_CHANGED' && message.pipelineId === deploymentId) {
        void load();
      } else if (message.type === 'EXECUTION_UPDATED' && message.pipelineId === deploymentId) {
        const update = message.data as Execution;
        setHistory(current => current && {
          ...current,
          logs: [update, ...current.logs.filter(entry => entry.id !== update.id)]
            .sort((left, right) => right.timestamp.localeCompare(left.timestamp)),
        });
      }
    });
    sendMessage({ type: 'AUTHENTICATE', data: { token } });
    return () => {
      remove();
      sendMessage({ type: 'UNSUBSCRIBE_PIPELINE', pipelineId: deploymentId });
    };
  }, [addListener, deploymentId, hasHistory, load, owner, sendMessage, status]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="ws-button" disabled={pending} onClick={() => void load()}>
          {pending ? 'Checking activity…' : history ? 'Refresh activity' : 'Load my activity'}
        </button>
        {deploymentId && status === 'DISCONNECTED' && <span role="status" className="text-xs text-[var(--ws-muted)]">Live updates disconnected</span>}
      </div>
      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
      {history?.indexer?.error && <p role="status" className="text-sm text-amber-200">Some receipts could not be refreshed.</p>}
      {history && (!history.logs.length ? (
        <WorkspaceState title={deploymentId && !history.indexer ? 'Waiting for the first history check.' : 'No matching execution receipts yet.'}
          action={{ label: 'Back to Active', href: deploymentId ? `/workspace/active?deployment=${encodeURIComponent(deploymentId)}` : '/workspace/active' }} />
      ) : (
        <ol className="ws-panel divide-y divide-[var(--ws-border)]">
          {history.logs.map(entry => (
            <li key={entry.id} className="space-y-2 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold">{entry.pipelineName}</p>
                <span className="ws-badge">{outcome[entry.status]}</span>
                <time className="text-xs tabular-nums text-[var(--ws-muted)]" dateTime={entry.timestamp}>{new Date(entry.timestamp).toLocaleString()}</time>
              </div>
              {entry.details.reason && <p className="text-sm text-[var(--ws-muted)]">{entry.details.reason}</p>}
              <div className="flex flex-wrap gap-4 text-sm">
                <a className="ws-address" href={`https://sepolia.basescan.org/tx/${entry.originTxHash}`}>Source Sync</a>
                {entry.reactiveTxHash && <a className="ws-address" href={`https://lasna.reactscan.net/tx/${entry.reactiveTxHash}`}>Reactive receipt</a>}
                {entry.destinationTxHash && <a className="ws-address" href={`https://sepolia.basescan.org/tx/${entry.destinationTxHash}`}>Vault callback</a>}
              </div>
            </li>
          ))}
        </ol>
      ))}
      {history?.next && <button type="button" className="ws-button self-start" disabled={pending} onClick={() => void loadEarlier()}>
        Load earlier receipts
      </button>}
    </>
  );
}
