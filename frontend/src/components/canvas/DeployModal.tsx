'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { 
  Rocket, 
  CheckCircle2, 
  ExternalLink, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  X, 
  KeyRound,
  RotateCcw
} from 'lucide-react';
import { useAccount, useConfig } from 'wagmi';
import { getAccount, readContract } from 'wagmi/actions';
import { formatEther, isAddressEqual, keccak256, stringToHex, type Address } from 'viem';
import { APP_CONFIG } from '@/lib/constants';
import { ACTION_VAULT_ABI, resolveStopLoss, STOP_LOSS_TEMPLATE, type StopLossGraph } from '@omniflow/shared';
import { truncateAddress } from '@/lib/utils';
import { invalidateWorkspaceSession, signInToWorkspace } from '@/lib/workspaceSession';
import { runDeploymentAction, type DeploymentSummary } from '@/lib/deployments';

type DeploymentResult = DeploymentSummary & {
  gasSponsored: { amountLReact: string };
  explorerUrls: { reactscan: string | null };
};

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  graph: StopLossGraph;
  workspacePipelineId?: string;
  name?: string;
}

export function DeployModal({ isOpen, onClose, graph, workspacePipelineId, name }: DeployModalProps) {
  const { address: userAddress, isConnected } = useAccount();
  const config = useConfig();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deployResult, setDeployResult] = useState<DeploymentResult | null>(null);

  const [isAuthPending, setAuthPending] = useState(false);
  const [deployOwner, setDeployOwner] = useState<Address>();
  const [authSuccess, setAuthSuccess] = useState(false);
  const attemptStorageKey = useRef<string>();
  const [funding, setFunding] = useState<{ amount?: string; error?: boolean }>();
  const [fundingRetry, setFundingRetry] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    setFunding(undefined);
    void fetch(`${APP_CONFIG.backendUrl}/api/pipeline/deployment-config`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Deployment configuration unavailable.');
        const { fundingLReact } = await response.json();
        if (typeof fundingLReact !== 'string' || !/^\d+(\.\d+)?$/.test(fundingLReact)) {
          throw new Error('Deployment funding is invalid.');
        }
        if (!controller.signal.aborted) setFunding({ amount: fundingLReact });
      })
      .catch(() => { if (!controller.signal.aborted) setFunding({ error: true }); });
    return () => controller.abort();
  }, [isOpen, fundingRetry]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  if (deployOwner && (!userAddress || !isConnected || !isAddressEqual(deployOwner, userAddress))) {
    return null;
  }
  const params = resolveStopLoss(graph);

  const handleDeploy = async () => {
    try {
      setLoading(true);
      setError(null);

      const owner = getAccount(config).address;
      if (!isConnected || !owner) throw new Error('Connect a wallet to deploy.');
      const { actionVaultAddress: vault } = resolveStopLoss(graph);
      const actualOwner = await readContract(config, {
        address: vault, abi: ACTION_VAULT_ABI, functionName: 'owner', chainId: 84532,
      });
      const current = getAccount(config).address;
      if (!current || !isAddressEqual(owner, current) || !isAddressEqual(owner, actualOwner)) {
        throw new Error('The connected wallet must own the selected Vault.');
      }
      const session = await signInToWorkspace(owner);
      const signer = getAccount(config);
      if (!signer.address || !isAddressEqual(owner, signer.address) || signer.chainId !== 84532) {
        throw new Error('Reconnect the deployment wallet on Base Sepolia.');
      }
      setDeployOwner(owner);

      const payload = {
        pipelineVersion: '1.0.0',
        metadata: {
          name: name ?? 'Flash Crash Stop-Loss',
          ownerAddress: owner,
        },
        networks: STOP_LOSS_TEMPLATE.networks,
        nodes: graph.nodes,
        edges: graph.edges,
      };

      const body = JSON.stringify(payload);
      const storageKey = `omniflow.deploy.v1.${keccak256(stringToHex(`${workspacePipelineId ?? ''}:${body}`))}`;
      attemptStorageKey.current = storageKey;
      let attemptKey = localStorage.getItem(storageKey);
      if (!attemptKey) {
        attemptKey = crypto.randomUUID();
        localStorage.setItem(storageKey, attemptKey);
      }
      const res = await fetch(`${APP_CONFIG.backendUrl}/api/pipeline/compile-and-deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
          'Idempotency-Key': attemptKey,
          ...(workspacePipelineId ? { 'Workspace-Pipeline-Id': workspacePipelineId } : {}),
        },
        body,
      });

      if (!res.ok) {
        if (res.status === 401) invalidateWorkspaceSession(session.token);
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || errJson.error || `Deploy failed with status ${res.status}`);
      }

      const data: DeploymentResult = await res.json();
      if (data.status === 'reverted') {
        setError('The Lasna deployment reverted. Check the transaction before deploying again.');
      }
      setDeployResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deploy pipeline to Reactive Lasna');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorizeVault = async () => {
    if (!deployResult?.contracts?.rscAddress || !deployOwner) return;
    setAuthPending(true);
    setError(null);
    try {
      await runDeploymentAction(deployOwner, deployResult, 'authorization');
      setAuthSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Vault authorization failed.');
    } finally {
      setAuthPending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="deploy-modal-title"
    >
      <div
        className="relative w-full max-w-lg rounded-xl border border-[var(--ws-border)] bg-[#191c24] p-5 shadow-2xl text-[var(--ws-text)] space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--ws-border)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-[var(--ws-accent-bg)] border border-[var(--ws-accent)]/20 text-[var(--ws-accent)]">
              <Rocket className="size-4" />
            </div>
            <div>
              <h2 id="deploy-modal-title" className="text-sm font-semibold tracking-tight text-white">
                Deploy Reactive Automation
              </h2>
              <p className="text-xs text-[var(--ws-muted)]">
                Autonomous execution on Reactive Lasna Testnet (Chain ID: 5318007)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[var(--ws-muted)] hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div role="alert" className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            <AlertCircle className="size-4 shrink-0 text-rose-400" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Initial Deploy Step */}
        {!deployResult ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-[var(--ws-border)] bg-[#111318] p-3.5 text-xs space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--ws-border)]">
                <span className="text-[var(--ws-muted)] font-medium">Pipeline Structure</span>
                <span className="font-semibold text-white tabular-nums px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[11px]">
                  {graph.nodes.length} Nodes &bull; {graph.edges.length} Edges
                </span>
              </div>

              <div className="space-y-2 text-xs text-zinc-300">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--ws-muted)]">Trigger Condition</span>
                  <span className="font-medium text-white tabular-nums">
                    Trigger at or below ${formatEther(params.priceThresholdWei)} USD
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--ws-muted)]">Execution Logic</span>
                  <span className="font-medium text-white tabular-nums">
                    Cooldown {params.cooldownSeconds.toString()}s &bull; Swap {params.percentToSwap.toString()}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--ws-muted)]">Action Vault</span>
                  <span className="font-mono text-zinc-300 text-[11px]" title={params.actionVaultAddress}>
                    {truncateAddress(params.actionVaultAddress)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--ws-muted)]">Initial RSC Funding</span>
                  <div className="flex items-center gap-1.5 font-medium tabular-nums text-xs">
                    {funding?.amount ? (
                      <span className="text-emerald-400 font-semibold">{funding.amount} lREACT</span>
                    ) : funding?.error ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-rose-400 text-[11px]">Unavailable</span>
                        <button
                          type="button"
                          onClick={() => setFundingRetry(v => v + 1)}
                          className="text-[11px] text-[var(--ws-accent)] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                        >
                          <RotateCcw className="size-3" /> Retry
                        </button>
                      </div>
                    ) : (
                      <span className="text-[var(--ws-muted)] text-[11px] flex items-center gap-1">
                        <Loader2 className="size-3 animate-spin" /> Checking...
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-[var(--ws-border)]/60">
                  <span className="text-[var(--ws-muted)]">Owner Signer</span>
                  <span className="font-mono text-[var(--ws-accent)] font-semibold text-[11px]">
                    {isConnected && userAddress ? truncateAddress(userAddress) : 'Connect wallet'}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[var(--ws-accent)]/20 bg-[var(--ws-accent-bg)]/30 p-3 text-xs text-zinc-300 flex items-start gap-2.5">
              <ShieldCheck className="size-4 shrink-0 mt-0.5 text-[var(--ws-accent)]" />
              <span className="leading-relaxed text-[11px]">
                Deployment requires a confirmed Lasna receipt. Vault authorization is a separate Base Sepolia transaction.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--ws-border)]">
              <button
                type="button"
                onClick={onClose}
                className="ws-button"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeploy}
                disabled={loading || !isConnected || !userAddress || !funding?.amount}
                className="ws-button ws-button-primary flex-1 min-h-[2.5rem] text-xs font-semibold cursor-pointer shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Deploying to Reactive Lasna...</span>
                  </>
                ) : (
                  <>
                    <Rocket className="size-4" />
                    <span>Deploy to Reactive Lasna</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : deployResult.status !== 'deployed' ? (
          <div className="space-y-3 text-xs">
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-amber-300 flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span role="status">{deployResult.status === 'signed' ? 'Awaiting Lasna receipt' : 'Lasna transaction reverted'}</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <a
                className="ws-button"
                href={`https://lasna.reactscan.net/tx/${deployResult.contracts.rscTxHash}`}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="size-3.5" />
                <span>View Lasna transaction</span>
              </a>
              {deployResult.status === 'signed' && (
                <button
                  type="button"
                  className="ws-button ws-button-primary"
                  disabled={loading}
                  onClick={handleDeploy}
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Checking receipt...</span>
                    </>
                  ) : (
                    'Check the same deployment'
                  )}
                </button>
              )}
              {deployResult.status === 'reverted' && (
                <button
                  type="button"
                  className="ws-button"
                  onClick={() => {
                    if (attemptStorageKey.current) localStorage.removeItem(attemptStorageKey.current);
                    setError(null);
                    setDeployResult(null);
                  }}
                >
                  Prepare a new attempt
                </button>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--ws-border)]">
              <button type="button" onClick={onClose} className="ws-button">
                Close
              </button>
              <Link className="ws-button ws-button-primary" href={`/workspace/active/${encodeURIComponent(deployResult.pipelineId)}`}>
                Open deployment in Active
              </Link>
            </div>
          </div>
        ) : (
          /* Step 2: Post-Deploy Non-Custodial Authorization Prompt */
          <div className="space-y-3.5">
            {/* Step 1: Lasna Deployed Info */}
            <div className="rounded-lg border border-[var(--ws-border)] bg-[#111318] p-3.5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--ws-border)]">
                <div className="flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 className="size-3.5" />
                  </span>
                  <span className="font-semibold text-white text-xs">Reactive Smart Contract</span>
                </div>
                <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                  DEPLOYED ON LASNA
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-zinc-300">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--ws-muted)]">Pipeline ID</span>
                  <span className="font-mono text-[11px] text-zinc-200" title={deployResult.pipelineId}>
                    {deployResult.pipelineId.length > 24
                      ? `${deployResult.pipelineId.slice(0, 18)}...`
                      : deployResult.pipelineId}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--ws-muted)]">RSC Address</span>
                  <span className="font-mono text-[11px] text-zinc-200">
                    {deployResult.contracts.rscAddress ? truncateAddress(deployResult.contracts.rscAddress) : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--ws-muted)]">Initial Funding</span>
                  <span className="font-medium text-emerald-400 tabular-nums">
                    {deployResult.gasSponsored?.amountLReact} lREACT
                  </span>
                </div>
              </div>

              {deployResult.explorerUrls?.reactscan && (
                <div className="flex justify-end pt-1.5 border-t border-[var(--ws-border)]/60">
                  <a
                    href={deployResult.explorerUrls.reactscan}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-[var(--ws-accent)] hover:underline transition-colors"
                  >
                    <span>View on ReactScan Explorer</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Step 2: Non-Custodial Authorization */}
            <div className="rounded-lg border border-[var(--ws-border)] bg-[#111318] p-3.5 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--ws-border)]">
                <div className="flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
                    <KeyRound className="size-3.5" />
                  </span>
                  <span className="font-semibold text-white text-xs">ActionVault Authorization</span>
                </div>
                {authSuccess ? (
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                    AUTHORIZED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                    STEP 2 REQUIRED
                  </span>
                )}
              </div>

              <p className="text-[11px] text-[var(--ws-muted)] leading-relaxed">
                Grant permission on Base Sepolia (<code className="font-mono text-zinc-300 bg-white/5 px-1 py-0.5 rounded text-[10px]">ActionVault.setAuthorizedRSC</code>) to allow this RSC to execute automated stop-loss swaps.
              </p>

              {authSuccess ? (
                <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs text-emerald-300">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                  <span>Vault permission confirmed. Ready to execute on Base Sepolia.</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleAuthorizeVault}
                  disabled={isAuthPending}
                  className="ws-button ws-button-primary w-full min-h-[2.5rem] text-xs font-semibold shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isAuthPending ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin text-[#201735]" />
                      <span>Signing on MetaMask...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="size-3.5" />
                      <span>Authorize RSC on ActionVault</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--ws-border)]">
              <button
                type="button"
                onClick={onClose}
                className="ws-button text-xs text-[var(--ws-muted)] hover:text-white"
              >
                Close
              </button>
              <div className="flex items-center gap-2">
                <Link
                  className="ws-button text-xs"
                  href={`/workspace/studio?deployment=${deployResult.pipelineId}`}
                >
                  View Snapshot
                </Link>
                <Link
                  className="ws-button ws-button-primary text-xs"
                  href={`/workspace/active/${encodeURIComponent(deployResult.pipelineId)}`}
                >
                  Open in Active
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
