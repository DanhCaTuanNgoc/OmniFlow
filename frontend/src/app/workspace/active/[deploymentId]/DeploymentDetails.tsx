'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { formatEther, parseEther, type Address } from 'viem';
import {
  Activity, AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Circle, CirclePlus, Code2, Coins, ExternalLink,
  HelpCircle, Info, KeyRound, ListChecks, Loader2, Pause, Play, RefreshCw, ShieldCheck, Sparkles, Wallet, X,
} from 'lucide-react';
import { resolveStopLoss, STOP_LOSS_TEMPLATE, type StopLossGraph } from '@omniflow/shared';
import { WorkspacePageHeader, WorkspaceState } from '@/components/common/WorkspaceUI';
import { useWorkspaceSignedIn, WorkspaceSignIn } from '@/components/common/WorkspaceSignIn';
import { deploymentStepKey, runDeploymentAction, setDeploymentArchived, setVaultRscAuthorization, takeProfitTemplate, type DeploymentDetail, type DeploymentSummary } from '@/lib/deployments';
import { WorkspaceWalletPromptCancelled, workspaceRequest } from '@/lib/workspaceSession';
import { ToastContainer, type ToastNotification } from '@/components/common/ToastContainer';
import { DeployDialog } from '@/components/canvas/DeployConfirmation';
import { useStudioHeaderStore } from '@/lib/studioHeaderStore';
import { truncateAddress } from '@/lib/utils';

const runtimeLabel = {
  unverified: 'RPC data unavailable',
  'awaiting-authorization': 'Awaiting Vault permission',
  'awaiting-principal': 'Awaiting principal',
  'awaiting-fees': 'Awaiting fees',
  ready: 'Ready at last check',
};

const runtimeDescription = {
  unverified: 'One or both networks could not be checked. Refresh to verify the current state.',
  'awaiting-authorization': 'The Vault owner needs to authorize this RSC before it can execute swaps.',
  'awaiting-principal': 'Deposit enough ETH for the configured swap amount to be greater than zero.',
  'awaiting-fees': 'The callback or Reactive fee balance is below budget, or has outstanding debt.',
  ready: 'Vault permission, swap funds and both fee budgets passed the latest check. The pipeline can act when its trigger conditions are met.',
};

const stepLabels = {
  'register-rsc': 'Register RSC',
  'price-policy': 'Configure Take-Profit policy',
  authorization: 'Authorize RSC',
  principal: 'Deposit principal',
  'callback-reserve': 'Fund callback reserve',
  'reactive-reserve': 'Fund Reactive reserve',
};

export default function DeploymentDetails({ id }: { id: string }) {
  const { address, isConnected } = useAccount();
  const signedIn = useWorkspaceSignedIn(isConnected ? address : undefined);

  return (
    <div className={signedIn ? 'ws-page space-y-4' : 'ws-page ws-page--sign-in'}>
      <Link href="/workspace/active" className="ws-button w-fit">
        <ArrowLeft className="size-4" /> Active Automations
      </Link>
      {address && signedIn ? (
        <WalletDeployment key={`${address}:${id}`} owner={address} id={id} />
      ) : (
        <>
          <WorkspacePageHeader title="Pipeline Details" />
          <WorkspaceSignIn />
        </>
      )}
    </div>
  );
}

function WalletDeployment({ owner, id }: { owner: Address; id: string }) {
  const [deployment, setDeployment] = useState<DeploymentDetail>();
  const [pending, setPending] = useState(true);
  const [error, setError] = useState<string>();
  const { setActiveAutomationHeader, clearActiveAutomationHeader } = useStudioHeaderStore();

  useEffect(() => {
    if (deployment?.name) {
      setActiveAutomationHeader(deployment.name);
    } else {
      clearActiveAutomationHeader();
    }
    return () => {
      clearActiveAutomationHeader();
    };
  }, [deployment?.name, setActiveAutomationHeader, clearActiveAutomationHeader]);

  const load = useCallback(async (signal?: AbortSignal) => {
    setPending(true);
    setError(undefined);
    try {
      const detail = await workspaceRequest<DeploymentDetail>(owner, `/pipeline/deployments/${encodeURIComponent(id)}`, { sessionOnly: true, signal });
      if (!signal?.aborted) setDeployment(detail);
    } catch (err) {
      if (signal?.aborted) return;
      setDeployment(undefined);
      setError(err instanceof Error ? err.message : 'Unable to load the deployment.');
    } finally {
      if (!signal?.aborted) setPending(false);
    }
  }, [id, owner]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  if (!deployment) {
    return (
      <>
        <WorkspacePageHeader title="Pipeline Details" />
        {error ? (
          <div role="alert" className="ws-panel flex flex-wrap items-center justify-between gap-3 p-4 text-sm text-rose-300">
            <span>{error}</span>
            <button type="button" className="ws-button" onClick={() => void load()}>Retry</button>
          </div>
        ) : (
          <WorkspaceState title="Loading pipeline details…" icon={<Activity className="size-6 animate-pulse" />} />
        )}
      </>
    );
  }

  return (
    <>
      <WorkspacePageHeader title={deployment.name} icon={<Activity className="size-4" />} actions={
        <button type="button" className="ws-button" onClick={() => void load()} disabled={pending}>
          <RefreshCw className={`size-3.5 ${pending ? 'animate-spin' : ''}`} />
          {pending ? 'Refreshing…' : 'Refresh status'}
        </button>
      } />
      <DeploymentPanel deployment={deployment} owner={owner} reload={load} />
    </>
  );
}

function stopLossConfiguration(deployment: DeploymentDetail) {
  if (deployment.template !== `${STOP_LOSS_TEMPLATE.id}@${STOP_LOSS_TEMPLATE.version}`) return undefined;
  try {
    return resolveStopLoss(deployment.graph as StopLossGraph);
  } catch {
    return undefined;
  }
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
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const { contracts, runtime, status } = deployment;

  const pushToast = useCallback((toast: Omit<ToastNotification, 'id'>) => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev.slice(-4), { ...toast, id }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const onboarding = runtime?.base?.onboarding;
  const profit = deployment.template === takeProfitTemplate;

  // Onboarding & Readiness state evaluation
  const isRegistered = Boolean(deployment.steps.some((s) => s.kind === 'register-rsc') || (onboarding && onboarding !== 'register-rsc'));
  const isPolicyConfigured = Boolean(deployment.steps.some((s) => s.kind === 'price-policy') || (onboarding === null && isRegistered));
  const isPolicyMismatch = onboarding === 'policy-mismatch';
  const principalBalance = runtime?.base?.principal ? BigInt(runtime.base.principal) : 0n;
  const isPrincipalFunded = principalBalance > 0n || Boolean(deployment.steps.some((s) => s.kind === 'principal'));
  const callbackReserves = runtime?.base?.callback?.reserves ? BigInt(runtime.base.callback.reserves) : 0n;
  const callbackBudget = runtime?.base?.callback?.budget ? BigInt(runtime.base.callback.budget) : 0n;
  const isCallbackFunded = (callbackReserves >= callbackBudget && callbackBudget > 0n) || Boolean(deployment.steps.some((s) => s.kind === 'callback-reserve'));
  const hasAuthorizedBefore = deployment.steps.some((s) => s.kind === 'authorization');
  const isBaseRpcAvailable = Boolean(runtime?.base);
  const isAuthorized = Boolean(runtime?.base?.authorized);
  const isPaused = hasAuthorizedBefore && !isAuthorized && isBaseRpcAvailable;
  const isAuthorizedOrOnboarded = isAuthorized || hasAuthorizedBefore;
  const isFullyConfigured = profit
    ? isRegistered && isPolicyConfigured && isPrincipalFunded && isCallbackFunded && isAuthorizedOrOnboarded
    : isAuthorizedOrOnboarded && isPrincipalFunded && isCallbackFunded;

  let nextStep: 'register-rsc' | 'price-policy' | 'principal' | 'callback-reserve' | 'authorization' | 'done' = 'done';
  if (profit) {
    if (isPolicyMismatch) {
      nextStep = 'price-policy';
    } else if (!isRegistered) {
      nextStep = 'register-rsc';
    } else if (!isPolicyConfigured) {
      nextStep = 'price-policy';
    } else if (!isPrincipalFunded) {
      nextStep = 'principal';
    } else if (!isCallbackFunded) {
      nextStep = 'callback-reserve';
    } else if (!isAuthorizedOrOnboarded) {
      nextStep = 'authorization';
    }
  } else {
    if (!isAuthorizedOrOnboarded) {
      nextStep = 'authorization';
    } else if (!isPrincipalFunded) {
      nextStep = 'principal';
    } else if (!isCallbackFunded) {
      nextStep = 'callback-reserve';
    }
  }

  async function doStep(kind: keyof typeof stepLabels) {
    setBusy(kind);
    try {
      const funding = kind === 'principal' || kind === 'callback-reserve' || kind === 'reactive-reserve';
      if (funding && amount && !/^\d+(\.\d{1,18})?$/.test(amount)) {
        pushToast({
          type: 'error',
          title: 'Invalid Amount',
          message: 'Enter a decimal amount with up to 18 places.',
        });
        return;
      }
      await runDeploymentAction(owner, deployment, kind, !funding || !amount ? undefined : parseEther(amount), deployment.graph);
      setAmount('');
      pushToast({
        type: 'success',
        tag: stepLabels[kind],
        title: 'Step Completed',
        message: `Receipt for ${stepLabels[kind]} verified and saved.`,
      });
      await reload();
    } catch (err) {
      if (err instanceof WorkspaceWalletPromptCancelled) return;
      pushToast({
        type: 'error',
        tag: stepLabels[kind],
        title: 'Step Failed',
        message: err instanceof Error ? err.message : 'Unable to complete the step.',
      });
    } finally {
      setBusy(undefined);
    }
  }

  async function retryDeployment() {
    setBusy('deploy');
    try {
      if (profit) { await reload(); return; }
      const result = await workspaceRequest<DeploymentSummary>(owner, '/pipeline/compile-and-deploy', {
        method: 'POST',
        headers: {
          'Idempotency-Key': deployment.requestKey,
          ...(deployment.workspacePipelineId ? { 'Workspace-Pipeline-Id': deployment.workspacePipelineId } : {}),
        },
        body: JSON.stringify(deployment.graph),
      });
      if (result.status === 'signed') {
        pushToast({
          type: 'info',
          title: 'Pending Receipt',
          message: 'The stored Lasna transaction is still awaiting its receipt.',
        });
      }
      await reload();
    } catch (err) {
      if (err instanceof WorkspaceWalletPromptCancelled) return;
      pushToast({
        type: 'error',
        title: 'Deployment Failed',
        message: err instanceof Error ? err.message : 'Unable to resume the deployment.',
      });
    } finally {
      setBusy(undefined);
    }
  }

  const label = isPaused
    ? 'Vault execution paused'
    : runtime
    ? runtimeLabel[runtime.status]
    : status === 'reverted'
    ? 'Lasna deployment reverted'
    : 'Waiting for Lasna receipt';

  async function handleTogglePauseResume() {
    if (!isBaseRpcAvailable) {
      pushToast({
        type: 'error',
        title: 'RPC Unavailable',
        message: 'Base Sepolia RPC connection is currently unavailable. Please verify network.',
      });
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
    try {
      await setVaultRscAuthorization(owner, deployment, willAuthorize);
      pushToast({
        type: willAuthorize ? 'success' : 'warning',
        tag: 'Vault Permission',
        title: willAuthorize ? 'Automation Resumed' : 'Automation Paused',
        message: willAuthorize ? 'Vault permission restored. Checking principal and reserves.' : 'Vault execution permission revoked.',
      });
      await reload();
    } catch (err) {
      if (err instanceof WorkspaceWalletPromptCancelled) return;
      pushToast({
        type: 'error',
        tag: 'Vault Permission',
        title: 'Update Failed',
        message: err instanceof Error ? err.message : 'Failed to update automation status.',
      });
    } finally {
      setBusy(undefined);
    }
  }

  async function handleArchiveChange() {
    const archived = !deployment.archivedAt;
    setBusy('archive');
    try {
      if (archived && isAuthorized) await setVaultRscAuthorization(owner, deployment, false);
      await setDeploymentArchived(owner, deployment.pipelineId, archived);
    } catch (error) {
      if (!(error instanceof WorkspaceWalletPromptCancelled)) {
        pushToast({
          type: 'error',
          title: 'Archive status update failed',
          message: error instanceof Error ? error.message : 'Unable to update the archive status.',
        });
      }
    } finally {
      await reload();
      setBusy(undefined);
    }
  }

  const configuration = stopLossConfiguration(deployment);
  const statusDescription = isPaused
    ? 'Vault permission was revoked. The RSC can still process events on Lasna and incur fees.'
    : runtime ? runtimeDescription[runtime.status] : undefined;
  const latestExecution = deployment.latestExecution;

  return (
    <div className="min-w-0 space-y-5">
      <section aria-label="Pipeline status" className="ws-panel space-y-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className={`text-sm font-semibold ${isPaused ? 'text-amber-300' : runtime?.status === 'ready' ? 'text-emerald-300' : 'text-white'}`}>
              {label}
            </p>
            {statusDescription && <p className="max-w-prose text-sm text-[var(--ws-muted)]">{statusDescription}</p>}
            {deployment.archivedAt && <p className="text-sm text-[var(--ws-muted)]">Archived in Workspace</p>}
            {runtime && (
              <p className="text-xs tabular-nums text-[var(--ws-muted)]">
                Last checked <time dateTime={runtime.readAt}>{new Date(runtime.readAt).toLocaleString()}</time>
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {deployment.status === 'deployed' && (
              <button type="button" className="ws-button"
                disabled={Boolean(busy) || (!deployment.archivedAt && !isBaseRpcAvailable)}
                onClick={() => void handleArchiveChange()}>
                {busy === 'archive' ? 'Updating archive…' : deployment.archivedAt ? 'Unarchive' : isAuthorized ? 'Pause & Archive' : 'Archive'}
              </button>
            )}
            <Link className="ws-button ws-button-primary" href={`/workspace/studio?deployment=${deployment.pipelineId}`}>
              <Code2 aria-hidden="true" className="size-4 shrink-0" />
              Open in Studio
            </Link>
            <Link className="ws-button" data-tone="accent" href={`/workspace/vault?deployment=${deployment.pipelineId}`}>
              <Wallet aria-hidden="true" className="size-4 shrink-0" />
              Open Vault
            </Link>
            <Link className="ws-button" data-tone="accent" href={`/workspace/logs?deployment=${deployment.pipelineId}`}>
              <ListChecks aria-hidden="true" className="size-4 shrink-0" />
              Open Logs
            </Link>
          </div>
        </div>
      </section>

      {onboarding === 'policy-mismatch' && <p role="alert" className="text-sm text-rose-300">The on-chain Vault policy differs from this Take-Profit revision.</p>}
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

      {/* Runtime Telemetry & Health Metrics (Section 2 & 7.1) */}
      {runtime && (
        <div className="ws-panel space-y-3 p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-white">Vault and execution fees</h2>

          <dl className="grid gap-3 text-xs font-mono tabular-nums sm:grid-cols-2 md:grid-cols-3">
            <div>
              <dt className="text-[var(--ws-muted)] text-xs">Vault Permission</dt>
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
              <dt className="text-[var(--ws-muted)] text-xs">Vault Principal</dt>
              <dd className="text-white font-medium mt-0.5">
                {runtime.base ? `${formatEther(BigInt(runtime.base.principal))} ETH` : 'RPC Unavailable'}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--ws-muted)] text-xs">Callback reserve / debt</dt>
              <dd className="text-white font-medium mt-0.5">
                {runtime.base ? `${formatEther(BigInt(runtime.base.callback.reserves))} / ${formatEther(BigInt(runtime.base.callback.debt))} ETH` : 'RPC Unavailable'}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--ws-muted)] text-xs">RSC Native Balance</dt>
              <dd className="text-white font-medium mt-0.5">
                {runtime.lasna ? `${formatEther(BigInt(runtime.lasna.native))} lREACT` : 'RPC Unavailable'}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--ws-muted)] text-xs">Reactive reserve / debt</dt>
              <dd className="text-white font-medium mt-0.5">
                {runtime.lasna ? `${formatEther(BigInt(runtime.lasna.reactive.reserves))} / ${formatEther(BigInt(runtime.lasna.reactive.debt))} lREACT` : 'RPC Unavailable'}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--ws-muted)] text-xs">Estimated fee budget (Base / Lasna)</dt>
              <dd className="text-white font-medium mt-0.5">
                {runtime.base ? `${formatEther(BigInt(runtime.base.callback.budget))} ETH` : 'RPC Unavailable'}
                {' / '}
                {runtime.lasna ? `${formatEther(BigInt(runtime.lasna.reactive.budget))} lREACT` : 'RPC Unavailable'}
              </dd>
            </div>
          </dl>

          {/* Step Actions & Pause/Resume Lifecycle Controls */}
          <div className="border-t border-[var(--ws-border)] pt-3 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="flex flex-wrap items-center gap-2 text-xs font-medium text-zinc-300">
                Funding amount (ETH or lREACT)
                <input
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.trim())}
                  placeholder="0.01"
                  className="w-32 max-w-full rounded-md border border-[var(--ws-border)] bg-[#0d0e15] px-2.5 py-1 font-mono text-xs text-white tabular-nums focus:border-[var(--ws-accent)] focus:outline-none"
                />
              </label>

              <div className="flex flex-wrap items-center gap-2">
                {/* Pause / Resume Automation Lifecycle Button (Section 2 & 7.1) */}
                {(hasAuthorizedBefore || isAuthorized) && (!deployment.archivedAt || isAuthorized) && (
                  <button
                    type="button"
                    onClick={() => void handleTogglePauseResume()}
                    disabled={Boolean(busy) || !isBaseRpcAvailable}
                    className="ws-button"
                    data-tone={isBaseRpcAvailable ? (isAuthorized ? 'caution' : 'positive') : undefined}
                    title={
                      !isBaseRpcAvailable
                        ? 'Base Sepolia RPC connection unavailable'
                        : isAuthorized
                        ? 'Revoke RSC Vault authorization to temporarily halt destination executions'
                        : 'Grant RSC Vault authorization to resume executions'
                    }
                  >
                    {!isBaseRpcAvailable ? (
                      'Pause / resume unavailable'
                    ) : busy === 'pause' || busy === 'resume' ? (
                      <><Loader2 aria-hidden="true" className="size-4 shrink-0 motion-safe:animate-spin" /> Confirming on Base…</>
                    ) : isAuthorized ? (
                      <><Pause aria-hidden="true" className="size-4 shrink-0" /> Pause Automation</>
                    ) : (
                      <><Play aria-hidden="true" className="size-4 shrink-0" /> Resume Automation</>
                    )}
                  </button>
                )}

                {(Object.keys(stepLabels) as (keyof typeof stepLabels)[]).map((kind) => {
                  const savedReceipt = profit && typeof window !== 'undefined' &&
                    Boolean(localStorage.getItem(deploymentStepKey(owner, deployment.pipelineId, kind)));
                  if ((kind === 'register-rsc' || kind === 'price-policy') && (!profit || (onboarding !== kind && !savedReceipt))) return null;
                  if (kind === 'authorization' && profit && onboarding && !savedReceipt) return null;
                  if (kind === 'authorization' && (hasAuthorizedBefore || deployment.archivedAt)) return null;
                  const Icon = kind === 'authorization' ? ShieldCheck : CirclePlus;
                  return (
                    <button
                      type="button"
                      key={kind}
                      onClick={() => void doStep(kind)}
                      disabled={Boolean(busy) || (kind === 'authorization' && !isBaseRpcAvailable)}
                      className="ws-button"
                      data-tone={kind === 'authorization' ? 'positive' : 'accent'}
                    >
                      <Icon aria-hidden="true" className="size-4 shrink-0" />
                      {busy === kind ? 'Confirming…' : savedReceipt ? `Check receipt for ${stepLabels[kind]}` : stepLabels[kind]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <section aria-labelledby="pipeline-config" className="ws-panel space-y-4 p-4 sm:p-5">
        <h2 id="pipeline-config" className="text-sm font-semibold text-white">Configuration and contracts</h2>
        {configuration && (
          <dl className="grid gap-3 text-xs tabular-nums sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-[var(--ws-muted)]">Price trigger</dt>
              <dd className="mt-1 font-medium text-white">ETH price &le; {formatEther(configuration.priceThresholdWei)} USDC</dd>
            </div>
            <div>
              <dt className="text-[var(--ws-muted)]">Swap amount</dt>
              <dd className="mt-1 font-medium text-white">{configuration.percentToSwap.toString()}% of Vault ETH</dd>
            </div>
            <div>
              <dt className="text-[var(--ws-muted)]">Cooldown</dt>
              <dd className="mt-1 font-medium text-white">{configuration.cooldownSeconds.toString()} seconds</dd>
            </div>
            <div>
              <dt className="text-[var(--ws-muted)]">Vault slippage cap</dt>
              <dd className="mt-1 font-medium text-white">{STOP_LOSS_TEMPLATE.maxSlippageBps / 100}%</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[var(--ws-muted)]">Monitored DEX pool (Base Sepolia)</dt>
              <dd className="mt-1">
                <a
                  className="inline-flex items-center gap-1 break-all font-mono text-[var(--ws-accent)] hover:underline"
                  href={`https://sepolia.basescan.org/address/${configuration.pairAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {configuration.pairAddress} <ExternalLink className="size-3 shrink-0" />
                </a>
              </dd>
            </div>
          </dl>
        )}
        <div className="grid gap-3 text-xs sm:grid-cols-3">
          <div className="min-w-0 space-y-1">
            <span className="text-xs text-[var(--ws-muted)]">Base Sepolia Vault</span>
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

          <div className="min-w-0 space-y-1">
            <span className="text-xs text-[var(--ws-muted)]">Lasna RSC Contract</span>
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
                <span className="text-xs text-[var(--ws-muted)] font-mono">Awaiting deployment receipt</span>
              )}
            </div>
          </div>

          <div className="min-w-0 space-y-1">
            <span className="text-xs text-[var(--ws-muted)]">Deploy TX Hash</span>
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

        <dl className="grid gap-3 border-t border-[var(--ws-border)] pt-3 text-xs sm:grid-cols-2">
          <div>
            <dt className="text-[var(--ws-muted)]">Deployment ID</dt>
            <dd className="mt-1 break-all font-mono text-white">{deployment.pipelineId}</dd>
          </div>
          <div>
            <dt className="text-[var(--ws-muted)]">Revision</dt>
            <dd className="mt-1 break-all font-mono text-white">{deployment.revisionId}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="pipeline-activity" className="ws-panel space-y-3 p-4 sm:p-5">
        <h2 id="pipeline-activity" className="text-sm font-semibold text-white">Latest execution and receipts</h2>
        {latestExecution ? (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <p className="text-[var(--ws-muted)]">
              <span className="font-medium capitalize text-white">{latestExecution.status.toLowerCase().replaceAll('_', ' ')}</span>
              {' ? '}
              <time dateTime={latestExecution.timestamp}>{new Date(latestExecution.timestamp).toLocaleString()}</time>
            </p>
            {latestExecution.destinationTxHash && (
              <a
                className="inline-flex items-center gap-1 text-[var(--ws-accent)] hover:underline"
                href={`https://sepolia.basescan.org/tx/${latestExecution.destinationTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Vault Receipt <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        ) : (
          <p className="text-xs text-[var(--ws-muted)]">No execution recorded yet.</p>
        )}
        {deployment.steps.length > 0 && (
          <div className="space-y-1.5 border-t border-[var(--ws-border)] pt-3">
            <span className="text-[10px] font-mono uppercase text-zinc-400">Step Receipts</span>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {deployment.steps.map((step) => (
                <li key={`${step.kind}:${step.txHash}`} className="min-w-0">
                  <a
                    className="inline-flex items-center gap-1.5 rounded border border-[var(--ws-border)] bg-[#111318] px-2.5 py-1 text-xs font-mono text-zinc-300 hover:text-white hover:border-[var(--ws-accent)] transition-colors w-full"
                    href={`${step.chainId === 84532 ? 'https://sepolia.basescan.org' : 'https://lasna.reactscan.net'}/tx/${step.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
                    <span>{stepLabels[step.kind]}</span>
                    <ExternalLink className="ml-auto size-2.5 shrink-0 text-[var(--ws-muted)]" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Floating Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
