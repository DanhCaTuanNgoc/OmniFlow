'use client';

import { Suspense, useCallback, useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { formatEther, type Address } from 'viem';
import { 
  Activity, 
  Search, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  AlertTriangle,
  Layers, 
  ChevronDown,
  Loader2,
  FileCheck2
} from 'lucide-react';
import { WorkspacePageHeader, WorkspaceState } from '@/components/common/WorkspaceUI';
import { useWorkspaceSignedIn, WorkspaceSignIn } from '@/components/common/WorkspaceSignIn';
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
  details: {
    reason?: string;
    executionId?: string;
    amountIn?: string;
    amountOut?: string;
    triggerPrice?: string;
    thresholdPrice?: string;
    executedPrice?: string;
  };
};

const outcome = {
  PENDING: { label: 'Confirming', icon: Clock, tone: 'text-amber-200' },
  UNVERIFIED: { label: 'Unverified', icon: AlertTriangle, tone: 'text-amber-200' },
  REORGED: { label: 'Needs recheck', icon: AlertTriangle, tone: 'text-amber-200' },
  SUCCESS: { label: 'Sold', icon: CheckCircle2, tone: 'text-emerald-300' },
  SKIPPED: { label: 'Skipped', icon: CheckCircle2, tone: 'text-slate-300' },
  FAILED: { label: 'Failed', icon: AlertCircle, tone: 'text-rose-300' },
} satisfies Record<Execution['status'], { label: string; icon: typeof Clock; tone: string }>;

function formatActivityAmount(raw?: string) {
  if (!raw || !/^\d+$/.test(raw)) return undefined;
  const [whole, fraction] = formatEther(BigInt(raw)).split('.');
  return fraction ? `${BigInt(whole).toLocaleString('en-US')}.${fraction}` : BigInt(whole).toLocaleString('en-US');
}

function describeExecution(entry: Execution) {
  const { status, details } = entry;
  const amountIn = formatActivityAmount(details.amountIn);
  const amountOut = formatActivityAmount(details.amountOut);
  const triggerPrice = formatActivityAmount(details.triggerPrice);
  const vaultPrice = formatActivityAmount(details.executedPrice);
  const threshold = formatActivityAmount(details.thresholdPrice);
  const priceContext = [
    triggerPrice && `Trigger price ${triggerPrice}`,
    threshold && `Threshold ${threshold}`,
    vaultPrice && details.executedPrice !== '0' && `Price at Vault check ${vaultPrice}`,
  ].filter(Boolean).join(' · ');

  switch (status) {
    case 'SUCCESS':
      return {
        title: amountIn ? `Sold ${amountIn} ETH` : 'Sale completed',
        description: amountOut ? `Your wallet received ${amountOut} payout tokens.` : 'The Vault completed this sale.',
        priceContext,
      };
    case 'SKIPPED': {
      const reasons: Record<string, string> = {
        'Price bounced back above stop threshold': 'The price recovered above your stop-loss threshold before the Vault could sell.',
        'Price fell below take-profit threshold': 'The price fell below your take-profit threshold before the Vault could sell.',
        'Order already settled': 'The Vault had already processed this order.',
        'Callback expired': 'The request expired before the Vault could act.',
      };
      const reason = details.reason ? reasons[details.reason] : undefined;
      return { title: 'No sale', description: reason ? `${reason} No ETH was sold in this run.` : 'The Vault skipped this run. No ETH was sold.', priceContext };
    }
    case 'PENDING':
      return {
        title: 'Trade signal received',
        description: details.reason?.includes('finality')
          ? 'Waiting for Base Sepolia to confirm the result.'
          : 'Checking whether the Vault sold or skipped this order.',
        priceContext,
      };
    case 'UNVERIFIED':
      return { title: 'Trade result unverified', description: 'We could not match all the transaction records for this run.', priceContext };
    case 'REORGED':
      return { title: 'Trade result needs rechecking', description: 'The network changed which block is recorded for this run.', priceContext };
    case 'FAILED':
      return { title: 'Sale failed', description: 'The request to sell failed. Open the transaction details for the reported reason.', priceContext };
  }
}

const transactionSteps = [
  { field: 'originTxHash', label: 'Price trigger · Base Sepolia', explorer: 'https://sepolia.basescan.org/tx/' },
  { field: 'reactiveTxHash', label: 'Automation request · Lasna', explorer: 'https://lasna.reactscan.net/tx/' },
  { field: 'destinationTxHash', label: 'Vault result · Base Sepolia', explorer: 'https://sepolia.basescan.org/tx/' },
] as const;

function ActivityEntry({ entry }: { entry: Execution }) {
  const { title, description, priceContext } = describeExecution(entry);
  const { label, icon: Icon, tone } = outcome[entry.status];
  return (
    <article className="space-y-3 rounded-xl border border-[var(--ws-border)] bg-[var(--ws-panel)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1.5 text-xs">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <span className="break-words font-medium text-slate-300">{entry.pipelineName}</span>
          <span className={`inline-flex items-center gap-1.5 font-medium ${tone}`}>
            <Icon aria-hidden="true" className="size-3.5" />
            {label}
          </span>
        </div>
        <time className="tabular-nums text-[var(--ws-muted)]" dateTime={entry.timestamp}>{new Date(entry.timestamp).toLocaleString()}</time>
      </div>
      <div>
        <h3 className="break-words text-base font-semibold tracking-tight text-white tabular-nums">{title}</h3>
        <p className="mt-1 break-words text-sm leading-relaxed text-slate-300 tabular-nums">{description}</p>
        {priceContext && (
          <p className="mt-1.5 text-xs leading-relaxed text-[var(--ws-muted)] tabular-nums">{priceContext} · payout tokens per ETH</p>
        )}
      </div>
      <details className="group border-t border-[var(--ws-border)] pt-2">
        <summary className="flex w-fit cursor-pointer list-none items-center gap-1.5 rounded text-xs font-medium text-[var(--ws-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 [&::-webkit-details-marker]:hidden">
          <ChevronDown aria-hidden="true" className="size-3.5 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
          On-chain details
        </summary>
        <div className="mt-2.5 space-y-2 text-xs">
          <ul className="space-y-1.5">
            {transactionSteps.map(({ field, label: stepLabel, explorer }) => {
              const hash = entry[field];
              return (
                <li key={field} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-slate-300">{stepLabel}</span>
                  {hash ? (
                    <a href={explorer + hash} target="_blank" rel="noopener noreferrer" aria-label={`View ${stepLabel} transaction`}
                      title={hash} className="inline-flex items-center gap-1 font-mono text-[var(--ws-accent)] underline underline-offset-2">
                      {hash.slice(0, 10)}…{hash.slice(-6)}
                      <ExternalLink aria-hidden="true" className="size-3" />
                    </a>
                  ) : <span className="text-[var(--ws-muted)]">Receipt unavailable</span>}
                </li>
              );
            })}
          </ul>
          {entry.details.executionId && <p className="break-all text-[var(--ws-muted)]">Execution ID <code>{entry.details.executionId}</code></p>}
          {entry.details.reason && <p className="break-words text-[var(--ws-muted)]">{entry.details.reason}</p>}
        </div>
      </details>
    </article>
  );
}

type History = {
  logs: Execution[];
  indexer: { checkedAt: string; error: boolean } | null;
  next: { timestamp: string; sequence: number } | null;
};

export default function ActivityLogsPage() {
  return (
    <Suspense fallback={<WorkspaceState title="Loading Activity Logs…" icon={<Activity className="size-6 animate-pulse" />} />}>
      <LogsRoute />
    </Suspense>
  );
}

function LogsRoute() {
  const { address, isConnected } = useAccount();
  const signedIn = useWorkspaceSignedIn(isConnected ? address : undefined);
  const id = useSearchParams().get('deployment');

  return (
    <div className={signedIn ? 'ws-page space-y-5' : 'ws-page ws-page--sign-in'}>
      <WorkspacePageHeader
        title="Activity Logs"
        description="Follow live on-chain events, Reactive RSC requests, and verified destination Vault receipts."
        icon={<Activity className="size-4" />}
        actions={
          <div className="flex items-center gap-2">
            <a
              href="/#proof"
              target="_blank"
              rel="noopener noreferrer"
              className="ws-button inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white"
              title="Inspect verified 3-tx on-chain execution proofs from buildathon judges"
            >
              <FileCheck2 className="size-3.5 text-emerald-400" />
              <span>Public Proofs</span>
              <ExternalLink className="size-3 text-zinc-400" />
            </a>
            <Link href="/workspace/active" className="ws-button ws-button-primary inline-flex items-center gap-1.5">
              <Layers className="size-3.5" />
              <span>Active Automations</span>
            </Link>
          </div>
        }
      />

      {isConnected && address && signedIn ? (
        <WebSocketProvider key={`${address}:${id ?? 'all'}`}>
          <WalletHistory owner={address} deploymentId={id} />
        </WebSocketProvider>
      ) : (
        <WorkspaceSignIn />
      )}
    </div>
  );
}

function WalletHistory({ owner, deploymentId }: { owner: Address; deploymentId: string | null }) {
  const [history, setHistory] = useState<History>();
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const { addListener, sendMessage, status } = useWebSocket();
  const path = deploymentId ? `/logs?pipelineId=${encodeURIComponent(deploymentId)}` : '/logs';

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'PENDING' | 'FAILED' | 'SKIPPED' | 'UNVERIFIED'>('ALL');

  const load = useCallback(async () => {
    setPending(true);
    setError(undefined);
    try {
      const res = await workspaceRequest<History>(owner, path, { sessionOnly: true });
      setHistory(res);
      setLastSyncedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to open activity.');
    } finally {
      setPending(false);
    }
  }, [owner, path]);

  const hasHistory = history !== undefined;

  useEffect(() => {
    void load();
  }, [load]);

  async function loadEarlier() {
    const next = history?.next;
    if (!next) return;
    setPending(true);
    setError(undefined);
    try {
      const params = new URLSearchParams({ before: next.timestamp, sequence: String(next.sequence) });
      const page = await workspaceRequest<History>(owner, `${path}${deploymentId ? '&' : '?'}${params}`, { sessionOnly: true });
      setHistory((current) => current && {
        ...page,
        logs: [...current.logs, ...page.logs.filter((entry) => !current.logs.some((c) => c.id === entry.id))],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load earlier receipts.');
    } finally {
      setPending(false);
    }
  }

  useEffect(() => {
    if (status !== 'CONNECTED' || !hasHistory || !deploymentId) return;
    const token = getWorkspaceSessionToken(owner);
    if (!token) return;
    const remove = addListener((message) => {
      if (getWorkspaceSessionToken(owner) !== token) return;
      if (message.type === 'AUTHENTICATED') {
        sendMessage({ type: 'SUBSCRIBE_PIPELINE', pipelineId: deploymentId });
      } else if (message.type === 'PIPELINE_STATUS_CHANGED' && message.pipelineId === deploymentId) {
        void load();
      } else if (message.type === 'EXECUTION_UPDATED' && message.pipelineId === deploymentId) {
        const update = message.data as Execution;
        setHistory((current) => current && {
          ...current,
          logs: [update, ...current.logs.filter((entry) => entry.id !== update.id)]
            .sort((left, right) => right.timestamp.localeCompare(left.timestamp)),
        });
        setLastSyncedAt(new Date());
      }
    });
    sendMessage({ type: 'AUTHENTICATE', data: { token } });
    return () => {
      remove();
      sendMessage({ type: 'UNSUBSCRIBE_PIPELINE', pipelineId: deploymentId });
    };
  }, [addListener, deploymentId, hasHistory, load, owner, sendMessage, status]);

  // Periodic polling when not live-subscribed to WebSocket
  useEffect(() => {
    if (!hasHistory) return;
    const isLive = status === 'CONNECTED' && Boolean(deploymentId);
    if (!isLive) {
      const interval = setInterval(() => {
        void load();
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [status, deploymentId, hasHistory, load]);

  const filteredLogs = useMemo(() => {
    if (!history?.logs) return [];
    return history.logs.filter((entry) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = entry.pipelineName.toLowerCase().includes(q);
        const matchReason = entry.details?.reason?.toLowerCase().includes(q);
        const matchOrigin = entry.originTxHash?.toLowerCase().includes(q);
        const matchReactive = entry.reactiveTxHash?.toLowerCase().includes(q);
        const matchDest = entry.destinationTxHash?.toLowerCase().includes(q);
        const summary = describeExecution(entry);
        const matchOutcome = [outcome[entry.status].label, summary.title, summary.description]
          .some(value => value.toLowerCase().includes(q));
        if (!matchName && !matchReason && !matchOrigin && !matchReactive && !matchDest && !matchOutcome) return false;
      }
      // Status
      if (statusFilter === 'SUCCESS') return entry.status === 'SUCCESS';
      if (statusFilter === 'PENDING') return entry.status === 'PENDING';
      if (statusFilter === 'FAILED') return entry.status === 'FAILED';
      if (statusFilter === 'UNVERIFIED') return entry.status === 'UNVERIFIED' || entry.status === 'REORGED';
      if (statusFilter === 'SKIPPED') return entry.status === 'SKIPPED';
      return true;
    });
  }, [history?.logs, searchQuery, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Toolbar: Search, Filters & Live Telemetry Indicator */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-[var(--ws-border)] bg-[var(--ws-panel)] p-2.5">
        <div className="relative flex-1 max-w-md">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search activity"
            placeholder="Search pipeline, outcome, or transaction"
            className="w-full rounded-md border border-[var(--ws-border)] bg-[#111318] pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-[var(--ws-accent)] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          {(
            [
              { key: 'ALL', label: `All (${history?.logs.length ?? 0})` },
              { key: 'SUCCESS', label: 'Sold' },
              { key: 'PENDING', label: 'Confirming' },
              { key: 'UNVERIFIED', label: 'Needs review' },
              { key: 'FAILED', label: 'Failed' },
              { key: 'SKIPPED', label: 'Skipped' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              aria-pressed={statusFilter === tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === tab.key
                  ? 'bg-[var(--ws-accent-bg)] text-[var(--ws-accent)] font-semibold'
                  : 'text-[var(--ws-muted)] hover:bg-white/5 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}

          <div className="h-4 w-px bg-[var(--ws-border)] mx-1" />

          {/* {status === 'CONNECTED' && Boolean(deploymentId) ? (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 text-[11px] text-emerald-300 font-mono">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live updates</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-500/10 border border-zinc-500/30 px-2 py-1 text-[11px] text-zinc-400 font-mono" title="Auto-polling receipts every 15s">
              <Clock aria-hidden="true" className="size-3" />
              <span>Refreshing automatically</span>
            </span>
          )} */}

          <button
            type="button"
            className="ws-button inline-flex items-center gap-1.5 shrink-0"
            disabled={pending}
            onClick={() => void load()}
            title="Refresh activity logs"
          >
            <RefreshCw className={`size-3 text-zinc-400 ${pending ? 'animate-spin' : ''}`} />
            <span>{pending ? 'Refreshing…' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {error ? (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-rose-900/60 bg-rose-950/30 p-3 text-xs text-rose-300">
          <AlertCircle className="size-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      ) : null}

      {history?.indexer?.error && (
        <p role="status" className="text-xs text-amber-200 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg">
          Some recent trades are still being checked.
        </p>
      )}

      {/* Stale data indicator when WS disconnected (Section 1 of Operations Analysis) */}
      {status !== 'CONNECTED' && hasHistory && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <Clock className="size-3.5 text-amber-400 shrink-0" />
            <span>
              Live updates are unavailable. Activity refreshes automatically{lastSyncedAt ? ` (last synced at ${lastSyncedAt.toLocaleTimeString()})` : ''}.
            </span>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={pending}
            className="text-xs font-semibold text-amber-200 underline hover:text-white shrink-0"
          >
            {pending ? 'Syncing…' : 'Sync now'}
          </button>
        </div>
      )}

      {/* Loading State or Logs List */}
      {pending && !history ? (
        <WorkspaceState
          title="Loading activity..."
          description="Checking for recent automation runs."
          icon={<Activity className="size-6 animate-spin text-[var(--ws-accent)]" />}
        />
      ) : history && (
        filteredLogs.length === 0 ? (
          <WorkspaceState
            title={history.logs.length === 0 ? 'No automation activity yet.' : 'No activity matches your search filter.'}
            description={history.logs.length === 0 ? 'Runs appear here after an active automation requests a trade.' : undefined}
            icon={<Activity className="size-6" />}
            action={{ label: 'Back to Active Automations', href: deploymentId ? `/workspace/active/${encodeURIComponent(deploymentId)}` : '/workspace/active' }}
          />
        ) : (
          <div className="space-y-3">
            {filteredLogs.map(entry => <ActivityEntry key={entry.id} entry={entry} />)}
          </div>
        )
      )}
      {history?.next && (
        <button type="button" className="ws-button text-xs" disabled={pending} onClick={() => void loadEarlier()}>
          Load earlier activity
        </button>
      )}
    </div>
  );
}
