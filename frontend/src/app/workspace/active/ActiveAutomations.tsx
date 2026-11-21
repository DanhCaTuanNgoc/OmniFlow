'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, useSwitchChain } from 'wagmi';
import { type Address } from 'viem';
import {
  Activity,
  Search,
  RefreshCw,
  Layers,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Zap,
  Network,
  Loader2
} from 'lucide-react';
import { WorkspacePageHeader, WorkspaceState } from '@/components/common/WorkspaceUI';
import { useWorkspaceSignedIn, WorkspaceSignIn } from '@/components/common/WorkspaceSignIn';
import { type DeploymentSummary } from '@/lib/deployments';
import { workspaceRequest } from '@/lib/workspaceSession';

export default function ActiveAutomations() {
  const { address, isConnected } = useAccount();
  const signedIn = useWorkspaceSignedIn(isConnected ? address : undefined);

  return (
    <div className={signedIn ? 'ws-page space-y-5' : 'ws-page ws-page--sign-in'}>
      <WorkspacePageHeader
        title="Active Automations"
        description="Monitor deployed pipelines, check Reactive Smart Contract status, and manage execution reserves."
        icon={<Activity className="size-4" />}
        actions={
          <Link href="/workspace/studio" className="ws-button ws-button-primary inline-flex items-center gap-1.5">
            <Network className="size-3.5" />
            <span>Open Studio</span>
          </Link>
        }
      />

      {isConnected && address && signedIn ? (
        <WalletDeployments key={address} owner={address} />
      ) : (
        <WorkspaceSignIn />
      )}
    </div>
  );
}

function WalletDeployments({ owner }: { owner: Address }) {
  const { chainId } = useAccount();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const isCorrectChain = chainId === 84532;
  const [list, setList] = useState<DeploymentSummary[]>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DEPLOYED' | 'SETUP' | 'PENDING'>('ALL');

  async function load() {
    setPending(true);
    setError(undefined);
    try {
      const result = await workspaceRequest<{ deployments: DeploymentSummary[] }>(owner, '/pipeline/deployments', { sessionOnly: true });
      setList(result.deployments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load deployments.');
    } finally {
      setPending(false);
    }
  }

  // Auto-load deployments on mount or when switching to correct chain
  useEffect(() => {
    if (isCorrectChain) {
      void load();
    }
  }, [owner, isCorrectChain]);

  const filteredList = useMemo(() => {
    if (!list) return [];
    return list.filter((item) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchId = item.pipelineId.toLowerCase().includes(q);
        const matchTpl = item.template.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchTpl) return false;
      }
      // Status filter
      if (statusFilter === 'DEPLOYED') {
        return item.status === 'deployed';
      }
      if (statusFilter === 'SETUP') {
        return item.status === 'reverted';
      }
      if (statusFilter === 'PENDING') {
        return item.status === 'signed';
      }
      return true;
    });
  }, [list, searchQuery, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Toolbar: Search, Filters & Refresh Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-[var(--ws-border)] bg-[var(--ws-panel)] p-2.5">
        <div className="relative flex-1 max-w-md">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search automations by name, template, or ID..."
            className="w-full rounded-md border border-[var(--ws-border)] bg-[#111318] pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-[var(--ws-accent)] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          {(
            [
              { key: 'ALL', label: `All (${list?.length ?? 0})` },
              { key: 'DEPLOYED', label: 'Deployed' },
              { key: 'SETUP', label: 'Reverted' },
              { key: 'PENDING', label: 'Pending' },
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

          <button
            type="button"
            className="ws-button inline-flex items-center gap-1.5 shrink-0"
            onClick={() => void load()}
            disabled={pending}
            title="Refresh deployments from blockchain"
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
                ? `Your wallet is currently on Chain ID ${chainId}. Please switch to Base Sepolia (84532) to interact with Active Automations.`
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
          <AlertTriangle className="size-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      ) : null}

      {/* Loading State or Grid of Automation Cards */}
      {pending && !list ? (
        <WorkspaceState
          title="Loading active automations..."
          description="Fetching your on-chain deployments from Base Sepolia and Lasna..."
          icon={<Activity className="size-6 animate-spin text-[var(--ws-accent)]" />}
        />
      ) : list && (
        filteredList.length === 0 ? (
          <WorkspaceState
            title={list.length === 0 ? 'No recorded deployments found for this wallet.' : 'No automations match your search filter.'}
            description={list.length === 0 ? 'Deploy your first pipeline from Studio or check verified public proofs.' : undefined}
            icon={<Layers className="size-6" />}
            action={list.length === 0 ? { label: 'Go to Pipeline Studio', href: '/workspace/studio' } : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredList.map((dep) => {
              const isDeployed = dep.status === 'deployed';
              const isPendingStatus = dep.status === 'signed';

              return (
                <Link
                  key={dep.pipelineId}
                  href={`/workspace/active/${encodeURIComponent(dep.pipelineId)}`}
                  aria-label={`Inspect Details: ${dep.name}`}
                  className="group flex flex-col justify-between rounded-xl border border-[var(--ws-border)] bg-[var(--ws-panel)] p-4 text-left transition-colors duration-150 hover:border-[var(--ws-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ws-accent)]"
                >
                  {/* Top row: Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isDeployed ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">
                          <CheckCircle2 className="size-2.5" />
                          <span>DEPLOYED</span>
                        </span>
                      ) : isPendingStatus ? (
                        <span className="inline-flex items-center gap-1 rounded bg-sky-500/10 border border-sky-500/30 px-1.5 py-0.5 text-[10px] font-medium text-sky-300">
                          <Zap className="size-2.5" />
                          <span>LASNA PENDING</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
                          <Clock className="size-2.5" />
                          <span>REVERTED</span>
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-zinc-500">
                      Base Sepolia
                    </span>
                  </div>

                  {/* Middle: Title & Revision */}
                  <div className="my-3 space-y-1">
                    <h3 className="text-sm font-semibold tracking-tight text-white group-hover:text-[var(--ws-accent)] transition-colors truncate">
                      {dep.name}
                    </h3>
                    <p className="text-xs text-[var(--ws-muted)] font-mono truncate">
                      {dep.template} · {dep.revisionId}
                    </p>
                  </div>

                  {/* Bottom row: CTA */}
                  <div className="flex items-center justify-between border-t border-[var(--ws-border)] pt-3 text-[11px] text-[var(--ws-muted)]">
                    <span className="font-mono text-[10px] text-zinc-400">
                      ID: {dep.pipelineId.slice(0, 8)}...
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-xs text-[var(--ws-accent)] group-hover:translate-x-0.5 transition-transform">
                      <span>Inspect Details</span>
                      <ArrowRight className="size-3" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )
      )}

    </div>
  );
}
