'use client';

import { Suspense, useCallback, useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAccount, useSwitchChain } from 'wagmi';
import type { Address } from 'viem';
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
  Zap, 
  Radio,
  Wifi,
  WifiOff,
  Loader2
} from 'lucide-react';
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

const outcome: Record<string, string> = {
  PENDING: 'Pending confirmation',
  UNVERIFIED: 'Reconciling receipts',
  REORGED: 'Reorganized',
  SUCCESS: 'Executed',
  SKIPPED: 'Skipped',
  FAILED: 'Failed',
};

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
  const id = useSearchParams().get('deployment');

  return (
    <div className="ws-page space-y-5">
      <WorkspacePageHeader
        title="Activity Logs"
        description="Follow live on-chain events, Reactive RSC requests, and verified destination Vault receipts."
        icon={<Activity className="size-4" />}
        actions={
          <Link href="/workspace/active" className="ws-button ws-button-primary inline-flex items-center gap-1.5">
            <Layers className="size-3.5" />
            <span>Active Automations</span>
          </Link>
        }
      />

      {isConnected && address ? (
        <WebSocketProvider key={`${address}:${id ?? 'all'}`}>
          <WalletHistory owner={address} deploymentId={id} />
        </WebSocketProvider>
      ) : (
        <WorkspaceState
          title="Connect your wallet to inspect activity logs."
          description="View live cross-chain execution receipts between Base Sepolia and Reactive Omni Lasna."
          icon={<Activity className="size-6" />}
          action={{ label: 'Open Pipeline Studio', href: '/workspace/studio' }}
        />
      )}
    </div>
  );
}

function WalletHistory({ owner, deploymentId }: { owner: Address; deploymentId: string | null }) {
  const { chainId } = useAccount();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const isCorrectChain = chainId === 84532;
  const [history, setHistory] = useState<History>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const { addListener, sendMessage, status } = useWebSocket();
  const path = deploymentId ? `/logs?pipelineId=${encodeURIComponent(deploymentId)}` : '/logs';

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'PENDING' | 'FAILED'>('ALL');

  const load = useCallback(async () => {
    setPending(true);
    setError(undefined);
    try {
      setHistory(await workspaceRequest<History>(owner, path));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to open activity.');
    } finally {
      setPending(false);
    }
  }, [owner, path]);

  const hasHistory = history !== undefined;

  // Auto-load activity on mount or when switching to correct chain
  useEffect(() => {
    if (isCorrectChain) {
      void load();
    }
  }, [load, isCorrectChain]);

  async function loadEarlier() {
    const next = history?.next;
    if (!next) return;
    setPending(true);
    setError(undefined);
    try {
      const params = new URLSearchParams({ before: next.timestamp, sequence: String(next.sequence) });
      const page = await workspaceRequest<History>(owner, `${path}${deploymentId ? '&' : '?'}${params}`);
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
      }
    });
    sendMessage({ type: 'AUTHENTICATE', data: { token } });
    return () => {
      remove();
      sendMessage({ type: 'UNSUBSCRIBE_PIPELINE', pipelineId: deploymentId });
    };
  }, [addListener, deploymentId, hasHistory, load, owner, sendMessage, status]);

  const filteredLogs = useMemo(() => {
    if (!history?.logs) return [];
    return history.logs.filter((entry) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = entry.pipelineName.toLowerCase().includes(q);
        const matchReason = entry.details?.reason?.toLowerCase().includes(q);
        const matchOrigin = entry.originTxHash?.toLowerCase().includes(q);
        const matchReactive = entry.reactiveTxHash?.toLowerCase().includes(q);
        const matchDest = entry.destinationTxHash?.toLowerCase().includes(q);
        if (!matchName && !matchReason && !matchOrigin && !matchReactive && !matchDest) return false;
      }
      // Status
      if (statusFilter === 'SUCCESS') return entry.status === 'SUCCESS';
      if (statusFilter === 'PENDING') return entry.status === 'PENDING' || entry.status === 'UNVERIFIED';
      if (statusFilter === 'FAILED') return entry.status === 'FAILED' || entry.status === 'REORGED' || entry.status === 'SKIPPED';
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
            placeholder="Search activity by pipeline, tx hash, or reason..."
            className="w-full rounded-md border border-[var(--ws-border)] bg-[#111318] pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-[var(--ws-accent)] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          {(
            [
              { key: 'ALL', label: `All (${history?.logs.length ?? 0})` },
              { key: 'SUCCESS', label: 'Executed' },
              { key: 'PENDING', label: 'Pending' },
              { key: 'FAILED', label: 'Failed/Skipped' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
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

          {status === 'CONNECTED' ? (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 text-[11px] text-emerald-300 font-mono">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live WS</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-500/10 border border-zinc-500/30 px-2 py-1 text-[11px] text-zinc-400 font-mono">
              <WifiOff className="size-3" />
              <span>Polling</span>
            </span>
          )}

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

      {/* Network Warning Banner or Error Display */}
      {(!isCorrectChain || error?.includes('Base Sepolia')) ? (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="size-4 text-rose-400 shrink-0" />
            <span>
              {chainId
                ? `Your wallet is currently on Chain ID ${chainId}. Please switch to Base Sepolia (84532) to stream activity receipts.`
                : 'Connect the deployment wallet to Base Sepolia (84532) to sign in.'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => switchChain?.({ chainId: 84532 })}
            disabled={isSwitchingChain}
            className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs px-3 py-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isSwitchingChain ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Switching...</span>
              </>
            ) : (
              <>
                <Zap className="size-3.5" />
                <span>Switch to Base Sepolia</span>
              </>
            )}
          </button>
        </div>
      ) : error ? (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-rose-900/60 bg-rose-950/30 p-3 text-xs text-rose-300">
          <AlertCircle className="size-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      ) : null}

      {history?.indexer?.error && (
        <p role="status" className="text-xs text-amber-200 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg">
          Some recent receipts could not be indexed yet. Pull to refresh.
        </p>
      )}

      {/* Loading State or Logs List */}
      {pending && !history ? (
        <WorkspaceState
          title="Loading activity logs..."
          description="Fetching cross-chain execution receipts from Base Sepolia and Lasna..."
          icon={<Activity className="size-6 animate-spin text-[var(--ws-accent)]" />}
        />
      ) : history && (
        filteredLogs.length === 0 ? (
          <WorkspaceState
            title={history.logs.length === 0 ? 'No matching execution receipts yet.' : 'No activity matches your search filter.'}
            description={history.logs.length === 0 ? 'Trigger a DEX trade or deposit to ActionVault to produce verifiable Reactive callbacks.' : undefined}
            icon={<Activity className="size-6" />}
            action={{ label: 'Back to Active Automations', href: deploymentId ? `/workspace/active?deployment=${encodeURIComponent(deploymentId)}` : '/workspace/active' }}
          />
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((entry) => {
              const isSuccess = entry.status === 'SUCCESS';
              const isPendingStatus = entry.status === 'PENDING' || entry.status === 'UNVERIFIED';

              return (
                <div
                  key={entry.id}
                  className="rounded-xl border border-[var(--ws-border)] bg-[var(--ws-panel)] p-4 space-y-3 transition-colors hover:border-[var(--ws-accent)]/50"
                >
                  {/* Top row: Pipeline name, status badge, timestamp */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white tracking-tight">
                        {entry.pipelineName}
                      </h3>
                      {isSuccess ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">
                          <CheckCircle2 className="size-2.5" />
                          <span>EXECUTED</span>
                        </span>
                      ) : isPendingStatus ? (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
                          <Clock className="size-2.5" />
                          <span>{entry.status}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 border border-rose-500/30 px-1.5 py-0.5 text-[10px] font-medium text-rose-300">
                          <AlertCircle className="size-2.5" />
                          <span>{outcome[entry.status] || entry.status}</span>
                        </span>
                      )}
                    </div>

                    <time className="text-xs font-mono text-[var(--ws-muted)] tabular-nums" dateTime={entry.timestamp}>
                      {new Date(entry.timestamp).toLocaleString()}
                    </time>
                  </div>

                  {/* Details or Reason */}
                  {entry.details.reason && (
                    <div className="rounded-md border border-[var(--ws-border)] bg-[#111318] p-2.5 text-xs font-mono text-zinc-300 leading-relaxed">
                      {entry.details.reason}
                    </div>
                  )}

                  {/* Verifiable 3-tier Transaction Hashes */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono">
                    <a
                      className="inline-flex items-center gap-1.5 rounded border border-[var(--ws-border)] bg-[#111318] px-2.5 py-1 text-zinc-300 hover:text-white hover:border-[var(--ws-accent)] transition-colors"
                      href={`https://sepolia.basescan.org/tx/${entry.originTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="size-1.5 rounded-full bg-cyan-400" />
                      <span>Origin: {entry.originTxHash.slice(0, 8)}...</span>
                      <ExternalLink className="size-2.5 text-zinc-500" />
                    </a>

                    {entry.reactiveTxHash && (
                      <a
                        className="inline-flex items-center gap-1.5 rounded border border-[var(--ws-border)] bg-[#111318] px-2.5 py-1 text-zinc-300 hover:text-white hover:border-[var(--ws-accent)] transition-colors"
                        href={`https://lasna.reactscan.net/tx/${entry.reactiveTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="size-1.5 rounded-full bg-purple-400" />
                        <span>RSC Lasna: {entry.reactiveTxHash.slice(0, 8)}...</span>
                        <ExternalLink className="size-2.5 text-zinc-500" />
                      </a>
                    )}

                    {entry.destinationTxHash && (
                      <a
                        className="inline-flex items-center gap-1.5 rounded border border-[var(--ws-border)] bg-[#111318] px-2.5 py-1 text-zinc-300 hover:text-white hover:border-[var(--ws-accent)] transition-colors"
                        href={`https://sepolia.basescan.org/tx/${entry.destinationTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="size-1.5 rounded-full bg-emerald-400" />
                        <span>Callback Vault: {entry.destinationTxHash.slice(0, 8)}...</span>
                        <ExternalLink className="size-2.5 text-zinc-500" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}

            {history?.next && (
              <div className="pt-2">
                <button
                  type="button"
                  className="ws-button text-xs"
                  disabled={pending}
                  onClick={() => void loadEarlier()}
                >
                  Load Earlier Receipts
                </button>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
