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
  KeyRound
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0E1017] border border-white/[0.10] shadow-2xl p-6 text-slate-100 backdrop-blur-2xl">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-white/[0.06] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5 pb-3 border-b border-white/[0.08]">
          <div className="p-3 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 shadow-sm">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Deploy Reactive Automation
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Autonomous execution on Reactive Lasna Testnet (Chain ID: 5318007)
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Initial Deploy Step */}
        {!deployResult ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#07080D] border border-white/[0.08] text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Pipeline Structure:</span>
                <span className="font-semibold text-white tabular-nums">{graph.nodes.length} Nodes &bull; {graph.edges.length} Edges</span>
              </div>
              <p className="tabular-nums">Trigger at or below ${formatEther(params.priceThresholdWei)} USD</p>
              <p className="tabular-nums">Cooldown {params.cooldownSeconds.toString()}s · Swap {params.percentToSwap.toString()}%</p>
              <p className="font-mono break-all">Vault {params.actionVaultAddress}</p>
              <p className="tabular-nums">
                {funding?.amount ? `Initial RSC funding: ${funding.amount} lREACT + deployment gas`
                  : funding?.error ? 'Funding configuration unavailable.' : 'Loading RSC funding...'}
              </p>
              {funding?.error && <button type="button" className="ws-button" onClick={() => setFundingRetry(value => value + 1)}>
                Retry funding check
              </button>}
              <div className="flex justify-between">
                <span className="text-slate-400">Owner Signer:</span>
                <span className="font-mono text-violet-300">
                  {isConnected && userAddress ? truncateAddress(userAddress) : 'Connect wallet'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-xs text-violet-100 flex gap-2.5">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-violet-400" />
              <span>
                Deployment requires a confirmed Lasna receipt. Vault authorization is a separate Base Sepolia transaction.
              </span>
            </div>

            <button
              onClick={handleDeploy}
              disabled={loading || !isConnected || !userAddress || !funding?.amount}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold rounded-full bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_25px_-3px_rgba(139,92,246,0.5)] transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deploying to Reactive Lasna...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  <span>Deploy to Reactive Lasna</span>
                </>
              )}
            </button>
          </div>
        ) : deployResult.status !== 'deployed' ? (
          <div className="space-y-3 text-sm">
            <p role="status">{deployResult.status === 'signed' ? 'Awaiting Lasna receipt' : 'Lasna transaction reverted'}</p>
            <a className="ws-button" href={`https://lasna.reactscan.net/tx/${deployResult.contracts.rscTxHash}`} target="_blank" rel="noreferrer">
              View Lasna transaction
            </a>
            {deployResult.status === 'signed' && <button type="button" className="ws-button" disabled={loading} onClick={handleDeploy}>
              {loading ? 'Checking receipt...' : 'Check the same deployment'}
            </button>}
            {deployResult.status === 'reverted' && <button type="button" className="ws-button" onClick={() => {
              if (attemptStorageKey.current) localStorage.removeItem(attemptStorageKey.current);
              setError(null);
              setDeployResult(null);
            }}>Prepare a new attempt</button>}
            <Link className="ws-button" href={`/workspace/active?deployment=${deployResult.pipelineId}`}>Open deployment in Active</Link>
          </div>
        ) : (
          /* Step 2: Post-Deploy Non-Custodial Authorization Prompt */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#07080D] border border-emerald-500/30 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                <span className="status-dot status-dot-emerald" />
                <span>RSC Successfully Deployed on Lasna</span>
              </div>
              <div className="space-y-1 font-mono text-[11px] text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Pipeline ID:</span>
                  <span className="text-cyan-400 font-bold">{deployResult.pipelineId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">RSC Contract:</span>
                  <span className="text-white">
                    {deployResult.contracts.rscAddress && truncateAddress(deployResult.contracts.rscAddress)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Funded at deployment:</span>
                  <span className="text-emerald-400 font-bold tabular-nums">{deployResult.gasSponsored?.amountLReact} lREACT</span>
                </div>
              </div>

              {deployResult.explorerUrls?.reactscan && (
                <a
                  href={deployResult.explorerUrls.reactscan}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-violet-300 hover:text-white pt-1 transition-colors"
                >
                  <span>View on ReactScan Explorer</span> <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Non-Custodial Step */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2.5">
              <div className="flex items-center gap-2 text-amber-300 font-semibold">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Non-Custodial Authorization (ActionVault)</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                To guarantee zero-trust non-custodial security, the owner signs 1 lightweight transaction calling <code className="text-amber-300 font-mono">setAuthorizedRSC()</code> on Base Sepolia.
              </p>
              {authSuccess ? (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <span className="status-dot status-dot-emerald" />
                  <span>Vault permission confirmed. Check principal and fee reserves in Active Automations.</span>
                </div>
              ) : (
                <button
                  onClick={handleAuthorizeVault}
                  disabled={isAuthPending}
                  className="w-full py-2.5 px-4 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {isAuthPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Signing on MetaMask...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Authorize RSC on ActionVault</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <Link className="ws-button" href={`/workspace/active?deployment=${deployResult.pipelineId}`}>
              Open deployment in Active
            </Link>
            <Link className="ws-button" href={`/workspace/studio?deployment=${deployResult.pipelineId}`}>
              View deployed snapshot
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
