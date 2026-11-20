'use client';

import { Suspense, useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAccount, useSwitchChain } from 'wagmi';
import { formatEther, parseEther, type Address } from 'viem';
import { 
  Activity, 
  Search, 
  RefreshCw, 
  Layers, 
  ArrowRight, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Zap, 
  Network,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { WorkspacePageHeader, WorkspaceState } from '@/components/common/WorkspaceUI';
import { runDeploymentAction, setVaultRscAuthorization, type DeploymentDetail, type DeploymentSummary } from '@/lib/deployments';
import { workspaceRequest } from '@/lib/workspaceSession';

const runtimeLabel = {
  unverified: 'RPC data unavailable',
  'awaiting-authorization': 'Awaiting Vault permission',
  'awaiting-principal': 'Awaiting principal',
  'awaiting-fees': 'Awaiting fees',
  ready: 'Ready at last check',
};

const stepLabels = {
  authorization: 'Authorize RSC',
  principal: 'Deposit principal',
  'callback-reserve': 'Fund callback reserve',
  'reactive-reserve': 'Fund Reactive reserve',
};

export default function ActiveAutomationsPage() {
  return (
    <Suspense fallback={<WorkspaceState title="Loading Active Automations…" icon={<Activity className="size-6 animate-pulse" />} />}>
      <ActiveRoute />
    </Suspense>
  );
}

function ActiveRoute() {
  const { address, isConnected } = useAccount();
  const id = useSearchParams().get('deployment');

  return (
    <div className="ws-page space-y-5">
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

      {isConnected && address ? (
        <WalletDeployments key={address} owner={address} selectedId={id} />
      ) : (
        <WorkspaceState
          title="Connect your wallet to inspect active automations."
          description="View live RSC contracts on Lasna Testnet and callback ActionVaults on Base Sepolia."
          icon={<Activity className="size-6" />}
          action={{ label: 'Open Pipeline Studio', href: '/workspace/studio' }}
        />
      )}
    </div>
  );
}

function WalletDeployments({ owner, selectedId }: { owner: Address; selectedId: string | null }) {
  const router = useRouter();
  const { chainId } = useAccount();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const isCorrectChain = chainId === 84532;
  const [list, setList] = useState<DeploymentSummary[]>();
  const [detail, setDetail] = useState<DeploymentDetail>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'READY' | 'SETUP' | 'PENDING'>('ALL');

  async function load(id = selectedId) {
    setPending(true);
    setError(undefined);
    try {
      const result = await workspaceRequest<{ deployments: DeploymentSummary[] }>(owner, '/pipeline/deployments');
      setList(result.deployments);
      setDetail(id ? await workspaceRequest<DeploymentDetail>(owner, `/pipeline/deployments/${encodeURIComponent(id)}`) : undefined);
    } catch (err) {
      setDetail(undefined);
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

  function select(id: string) {
    router.replace(`/workspace/active?deployment=${id}`, { scroll: false });
    void load(id);
  }

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
      if (statusFilter === 'READY') {
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
              { key: 'READY', label: 'Ready' },
              { key: 'SETUP', label: 'Needs Setup' },
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
              const isSelected = dep.pipelineId === selectedId;
              const isReady = dep.status === 'deployed';
              const isPendingStatus = dep.status === 'signed';

              return (
                <div
                  key={dep.pipelineId}
                  role="button"
                  tabIndex={0}
                  onClick={() => select(dep.pipelineId)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      select(dep.pipelineId);
                    }
                  }}
                  className={`group relative flex flex-col justify-between rounded-xl border p-4 text-left transition-all duration-200 cursor-pointer focus:outline-none ${
                    isSelected
                      ? 'border-[var(--ws-accent)] bg-[var(--ws-panel)] shadow-lg shadow-[var(--ws-accent-bg)]/30 ring-1 ring-[var(--ws-accent)]'
                      : 'border-[var(--ws-border)] bg-[var(--ws-panel)] hover:border-[var(--ws-accent)]/70 hover:shadow-lg hover:shadow-[var(--ws-accent-bg)]/20 hover:-translate-y-0.5'
                  }`}
                >
                  {/* Top row: Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isReady ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">
                          <CheckCircle2 className="size-2.5" />
                          <span>READY</span>
                        </span>
                      ) : isPendingStatus ? (
                        <span className="inline-flex items-center gap-1 rounded bg-sky-500/10 border border-sky-500/30 px-1.5 py-0.5 text-[10px] font-medium text-sky-300">
                          <Zap className="size-2.5" />
                          <span>LASNA PENDING</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
                          <Clock className="size-2.5" />
                          <span>SETUP NEEDED</span>
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
                      <span>{isSelected ? 'Inspecting' : 'Inspect Details'}</span>
                      <ArrowRight className="size-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Selected Deployment Detail Panel */}
      {detail?.pipelineId === selectedId && (
        <DeploymentPanel
          key={detail.pipelineId}
          deployment={detail}
          owner={owner}
          reload={() => load(detail.pipelineId)}
        />
      )}
    </div>
  );
}

function DeploymentPanel({
  deployment,
  owner,
  reload,
}: {
  deployment: DeploymentDetail;
  owner: Address;
  reload: () => Promise<void>;
}) {
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState<string>();
  const [message, setMessage] = useState<{ text: string; error: boolean }>();
  const { contracts, runtime, status } = deployment;

  async function doStep(kind: keyof typeof stepLabels) {
    setBusy(kind);
    setMessage(undefined);
    try {
      if (kind !== 'authorization' && amount && !/^\d+(\.\d{1,18})?$/.test(amount)) {
        throw new Error('Enter a decimal amount with up to 18 places.');
      }
      await runDeploymentAction(owner, deployment, kind, kind === 'authorization' || !amount ? undefined : parseEther(amount));
      setAmount('');
      setMessage({ text: 'Receipt verified and saved.', error: false });
      await reload();
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Unable to complete the step.', error: true });
    } finally {
      setBusy(undefined);
    }
  }

  async function retryDeployment() {
    setBusy('deploy');
    setMessage(undefined);
    try {
      const result = await workspaceRequest<DeploymentSummary>(owner, '/pipeline/compile-and-deploy', {
        method: 'POST',
        headers: {
          'Idempotency-Key': deployment.requestKey,
          ...(deployment.workspacePipelineId ? { 'Workspace-Pipeline-Id': deployment.workspacePipelineId } : {}),
        },
        body: JSON.stringify(deployment.graph),
      });
      if (result.status === 'signed') {
        setMessage({ text: 'The stored Lasna transaction is still awaiting its receipt.', error: false });
      }
      await reload();
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Unable to resume the deployment.', error: true });
    } finally {
      setBusy(undefined);
    }
  }

  const hasAuthorizedBefore = deployment.steps.some((s) => s.kind === 'authorization');
  const isBaseRpcAvailable = runtime?.base !== null && runtime?.status !== 'unverified';
  const isAuthorized = Boolean(runtime?.base?.authorized);
  const isPaused = hasAuthorizedBefore && !isAuthorized && isBaseRpcAvailable;

  const label = isPaused
    ? 'Automation paused by owner'
    : runtime
    ? runtimeLabel[runtime.status]
    : status === 'reverted'
    ? 'Lasna deployment reverted'
    : 'Waiting for Lasna receipt';

  const getHealthBadge = () => {
    if (!runtime || runtime.status === 'unverified') {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-zinc-500/10 border border-zinc-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400">
          <AlertTriangle className="size-2.5" />
          <span>RPC UNAVAILABLE</span>
        </span>
      );
    }
    const hasDebt = BigInt(runtime.base?.callback?.debt ?? 0) > 0n || BigInt(runtime.lasna?.reactive?.debt ?? 0) > 0n;
    if (hasDebt) {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 border border-rose-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-rose-300">
          <AlertTriangle className="size-2.5" />
          <span>DEBT OUTSTANDING</span>
        </span>
      );
    }
    if (runtime.status === 'ready') {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
          <ShieldCheck className="size-2.5" />
          <span>HEALTHY</span>
        </span>
      );
    }
    if (runtime.status === 'awaiting-fees') {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
          <Clock className="size-2.5" />
          <span>LOW RESERVE</span>
        </span>
      );
    }
    if (runtime.status === 'awaiting-principal') {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
          <Clock className="size-2.5" />
          <span>AWAITING PRINCIPAL</span>
        </span>
      );
    }
    if (isPaused) {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
          <Clock className="size-2.5" />
          <span>PAUSED</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
        <Clock className="size-2.5" />
        <span>AWAITING SETUP</span>
      </span>
    );
  };

  async function handleTogglePauseResume() {
    if (!isBaseRpcAvailable) {
      setMessage({ text: 'Base Sepolia RPC connection is currently unavailable. Please verify network.', error: true });
      return;
    }
    const willAuthorize = !isAuthorized;
    if (willAuthorize && runtime?.status === 'awaiting-fees') {
      const confirmed = window.confirm(
        'Warning: Callback or Reactive gas reserves are below recommended budget. Automation may fail or incur debt upon trigger. Do you still wish to resume?'
      );
      if (!confirmed) return;
    }
    setBusy(willAuthorize ? 'resume' : 'pause');
    setMessage(undefined);
    try {
      await setVaultRscAuthorization(owner, deployment, willAuthorize);
      setMessage({
        text: willAuthorize ? 'Automation resumed. Vault execution permission restored.' : 'Automation paused. Vault execution permission revoked.',
        error: false,
      });
      await reload();
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Failed to update automation status.', error: true });
    } finally {
      setBusy(undefined);
    }
  }

  return (
    <section className="rounded-xl border border-[var(--ws-border)] bg-[var(--ws-panel)] p-5 space-y-5 animate-in fade-in duration-150" aria-label="Selected deployment">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ws-border)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight">{deployment.name}</h2>
            <span className="inline-flex items-center gap-1 rounded bg-white/5 border border-white/10 px-2 py-0.5 text-xs text-zinc-300 font-medium">
              {label}
            </span>
          </div>
          <p className="text-xs text-[var(--ws-muted)] mt-0.5 font-mono">
            Pipeline ID: {deployment.pipelineId}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link className="ws-button text-xs" href={`/workspace/studio?deployment=${deployment.pipelineId}`}>
            Open in Studio
          </Link>
          <Link className="ws-button text-xs" href={`/workspace/vault?deployment=${deployment.pipelineId}`}>
            Open Vault
          </Link>
          <Link className="ws-button text-xs" href={`/workspace/logs?deployment=${deployment.pipelineId}`}>
            Open Logs
          </Link>
        </div>
      </div>

      {/* Contract Addresses Grid */}
      <div className="grid gap-3 text-xs md:grid-cols-3">
        <div className="rounded-lg border border-[var(--ws-border)] bg-[#111318] p-3 space-y-1">
          <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Base Sepolia Vault</span>
          <div>
            <a
              className="inline-flex items-center gap-1 text-xs font-mono text-[var(--ws-accent)] hover:underline break-all"
              href={`https://sepolia.basescan.org/address/${contracts.vaultAddress}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>{contracts.vaultAddress.slice(0, 10)}...{contracts.vaultAddress.slice(-6)}</span>
              <ExternalLink className="size-3 shrink-0" />
            </a>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--ws-border)] bg-[#111318] p-3 space-y-1">
          <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Lasna RSC Contract</span>
          <div>
            {contracts.rscAddress ? (
              <a
                className="inline-flex items-center gap-1 text-xs font-mono text-[var(--ws-accent)] hover:underline break-all"
                href={`https://lasna.reactscan.net/address/${contracts.rscAddress}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>{contracts.rscAddress.slice(0, 10)}...{contracts.rscAddress.slice(-6)}</span>
                <ExternalLink className="size-3 shrink-0" />
              </a>
            ) : (
              <span className="text-xs text-zinc-500 font-mono">Awaiting deployment receipt</span>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-[var(--ws-border)] bg-[#111318] p-3 space-y-1">
          <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Deploy TX Hash</span>
          <div>
            {status === 'signed' ? (
              <code className="text-xs font-mono text-zinc-300 break-all">{contracts.rscTxHash.slice(0, 14)}...</code>
            ) : (
              <a
                className="inline-flex items-center gap-1 text-xs font-mono text-[var(--ws-accent)] hover:underline break-all"
                href={`https://lasna.reactscan.net/tx/${contracts.rscTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>{contracts.rscTxHash.slice(0, 10)}...{contracts.rscTxHash.slice(-6)}</span>
                <ExternalLink className="size-3 shrink-0" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Latest Execution */}
      {deployment.latestExecution && (
        <div className="flex items-center justify-between rounded-lg border border-[var(--ws-border)] bg-[#111318] px-3.5 py-2 text-xs">
          <span className="text-zinc-400">
            Latest Execution Status: <span className="font-semibold text-white capitalize">{deployment.latestExecution.status.toLowerCase()}</span>
          </span>
          {deployment.latestExecution.destinationTxHash && (
            <a
              className="inline-flex items-center gap-1 font-mono text-xs text-[var(--ws-accent)] hover:underline"
              href={`https://sepolia.basescan.org/tx/${deployment.latestExecution.destinationTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Vault Receipt</span>
              <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      )}

      {/* Retry if signed / awaiting receipt */}
      {status === 'signed' && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3.5 space-y-2">
          {deployment.broadcastLimitReached && (
            <p role="status" className="text-xs text-amber-200">
              Broadcast retry limit reached. Check the stored transaction hash on Lasna explorer for confirmation.
            </p>
          )}
          <button
            type="button"
            className="ws-button ws-button-primary"
            disabled={Boolean(busy)}
            onClick={() => void retryDeployment()}
          >
            {busy ? 'Checking Lasna…' : deployment.broadcastLimitReached ? 'Check Stored Receipt' : 'Resume Stored Deployment'}
          </button>
        </div>
      )}

      {/* Paused Warning Banner (Section 2 & FRS) */}
      {isPaused && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-300 space-y-1">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="size-4 text-amber-400 shrink-0" />
            <span>Automation is Paused (Vault Execution Disabled)</span>
          </div>
          <p className="text-[11px] text-amber-200/80 leading-relaxed pl-6">
            The ActionVault on Base Sepolia has revoked execution permissions for this RSC.
            <strong> Note:</strong> The RSC contract on Reactive Omni Lasna remains deployed and active, continuing to consume gas for event listening and evaluating until refueled or unsubscribed.
          </p>
        </div>
      )}

      {/* Runtime Telemetry & Health Metrics (Section 2 & 7.1) */}
      {runtime && (
        <div className="space-y-3 rounded-lg border border-[var(--ws-border)] bg-[#111318] p-4">
          <div className="flex flex-wrap items-center justify-between text-xs text-[var(--ws-muted)] border-b border-[var(--ws-border)] pb-2 font-mono gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-300">On-Chain Runtime Telemetry</span>
              {getHealthBadge()}
            </div>
            <span>Checked: {new Date(runtime.readAt).toLocaleTimeString()}</span>
          </div>

          <dl className="grid gap-3 text-xs font-mono tabular-nums sm:grid-cols-2 md:grid-cols-3">
            <div>
              <dt className="text-zinc-500 text-[11px]">Vault Permission</dt>
              <dd className="text-white font-medium mt-0.5">
                {runtime.base ? (
                  runtime.base.authorized ? (
                    <span className="text-emerald-400 font-semibold">Granted (Authorized)</span>
                  ) : isPaused ? (
                    <span className="text-amber-400 font-semibold">Paused (Permission Revoked)</span>
                  ) : (
                    <span className="text-zinc-400">Awaiting Owner Approval</span>
                  )
                ) : (
                  <span className="text-rose-400">RPC Unavailable</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500 text-[11px]">Vault Principal</dt>
              <dd className="text-white font-medium mt-0.5">
                {runtime.base ? `${formatEther(BigInt(runtime.base.principal))} ETH` : 'RPC Unavailable'}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500 text-[11px]">Callback Reserve / Debt</dt>
              <dd className="text-white font-medium mt-0.5">
                {runtime.base ? `${formatEther(BigInt(runtime.base.callback.reserves))} / ${formatEther(BigInt(runtime.base.callback.debt))} ETH` : 'RPC Unavailable'}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500 text-[11px]">RSC Native Balance</dt>
              <dd className="text-white font-medium mt-0.5">
                {runtime.lasna ? `${formatEther(BigInt(runtime.lasna.native))} lREACT` : 'RPC Unavailable'}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500 text-[11px]">Reactive Reserve / Debt</dt>
              <dd className="text-white font-medium mt-0.5">
                {runtime.lasna ? `${formatEther(BigInt(runtime.lasna.reactive.reserves))} / ${formatEther(BigInt(runtime.lasna.reactive.debt))} lREACT` : 'RPC Unavailable'}
              </dd>
            </div>
          </dl>

          {/* Step Actions & Pause/Resume Lifecycle Controls */}
          <div className="border-t border-[var(--ws-border)] pt-3 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs text-zinc-300 font-medium">
                Funding amount (ETH or lREACT):
                <input
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.trim())}
                  placeholder="0.01"
                  className="ml-2 w-32 rounded-md border border-[var(--ws-border)] bg-[#0d0e15] px-2.5 py-1 text-xs text-white font-mono tabular-nums focus:border-[var(--ws-accent)] focus:outline-none"
                />
              </label>

              <div className="flex flex-wrap items-center gap-2">
                {/* Pause / Resume Automation Lifecycle Button (Section 2 & 7.1) */}
                {hasAuthorizedBefore && (
                  <button
                    type="button"
                    onClick={() => void handleTogglePauseResume()}
                    disabled={Boolean(busy) || !isBaseRpcAvailable}
                    className={`ws-button text-xs inline-flex items-center gap-1 font-semibold ${
                      !isBaseRpcAvailable
                        ? 'opacity-50 cursor-not-allowed'
                        : isAuthorized
                        ? 'border-amber-500/30 bg-amber-950/20 text-amber-300 hover:bg-amber-950/40'
                        : 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-950/40'
                    }`}
                    title={
                      !isBaseRpcAvailable
                        ? 'Base Sepolia RPC connection unavailable'
                        : isAuthorized
                        ? 'Revoke RSC Vault authorization to temporarily halt destination executions'
                        : 'Grant RSC Vault authorization to resume executions'
                    }
                  >
                    {busy === 'pause' || busy === 'resume' ? (
                      'Confirming on Base…'
                    ) : isAuthorized ? (
                      'Pause Automation'
                    ) : (
                      'Resume Automation'
                    )}
                  </button>
                )}

                {(Object.keys(stepLabels) as (keyof typeof stepLabels)[]).map((kind) => {
                  if (kind === 'authorization' && hasAuthorizedBefore) return null; // Managed by Pause/Resume toggle
                  return (
                    <button
                      type="button"
                      key={kind}
                      onClick={() => void doStep(kind)}
                      disabled={Boolean(busy) || (kind === 'authorization' && !isBaseRpcAvailable)}
                      className="ws-button text-xs"
                    >
                      {busy === kind ? 'Confirming…' : stepLabels[kind]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {message && (
        <p
          role={message.error ? 'alert' : 'status'}
          className={`break-words text-xs rounded-lg p-2.5 border ${
            message.error ? 'text-rose-300 bg-rose-950/20 border-rose-900/40' : 'text-emerald-300 bg-emerald-950/20 border-emerald-900/40'
          }`}
        >
          {message.text}
        </p>
      )}

      {/* Step Receipts List */}
      {deployment.steps.length > 0 && (
        <div className="space-y-1.5 border-t border-[var(--ws-border)] pt-3">
          <span className="text-[10px] font-mono uppercase text-zinc-400">Step Receipts</span>
          <ul className="grid gap-2 sm:grid-cols-2">
            {deployment.steps.map((step) => (
              <li key={`${step.kind}:${step.txHash}`}>
                <a
                  className="inline-flex items-center gap-1.5 rounded border border-[var(--ws-border)] bg-[#111318] px-2.5 py-1 text-xs font-mono text-zinc-300 hover:text-white hover:border-[var(--ws-accent)] transition-colors w-full"
                  href={`${step.chainId === 84532 ? 'https://sepolia.basescan.org' : 'https://lasna.reactscan.net'}/tx/${step.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
                  <span className="truncate">{stepLabels[step.kind]}</span>
                  <ExternalLink className="size-2.5 ml-auto text-zinc-500" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
