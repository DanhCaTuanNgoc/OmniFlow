'use client';

import React, { useState } from 'react';
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
import { useAccount, useWriteContract } from 'wagmi';
import { APP_CONFIG, CONTRACT_ADDRESSES } from '@/lib/constants';
import { ACTION_VAULT_ABI } from '@omniflow/shared';
import { truncateAddress } from '@/lib/utils';

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  graph: any;
}

export function DeployModal({ isOpen, onClose, graph }: DeployModalProps) {
  const { address: userAddress, isConnected } = useAccount();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deployResult, setDeployResult] = useState<any | null>(null);

  const { writeContractAsync, isPending: isAuthPending } = useWriteContract();
  const [authSuccess, setAuthSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDeploy = async () => {
    try {
      setLoading(true);
      setError(null);

      const owner = userAddress || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

      const payload = {
        pipelineVersion: '1.0.0',
        metadata: {
          name: 'Flash Crash Stop-Loss',
          ownerAddress: owner,
          createdAt: Date.now(),
        },
        networks: {
          originChainId: 84532,
          reactiveChainId: 5318007,
          destinationChainId: 84532,
        },
        nodes: graph.nodes,
        edges: graph.edges,
      };

      const res = await fetch(`${APP_CONFIG.backendUrl}/api/pipeline/compile-and-deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Deploy failed with status ${res.status}`);
      }

      const data = await res.json();
      setDeployResult(data);
    } catch (err: any) {
      console.error('Deployment error:', err);
      setError(err.message || 'Failed to deploy pipeline to Reactive Lasna');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorizeVault = async () => {
    if (!deployResult?.contracts?.rscAddress) return;
    try {
      const rscAddress = deployResult.contracts.rscAddress as `0x${string}`;
      const vaultAddress =
        (deployResult.contracts.vaultAddress as `0x${string}`) ||
        CONTRACT_ADDRESSES.DEFAULT_ACTION_VAULT;

      await writeContractAsync({
        address: vaultAddress,
        abi: ACTION_VAULT_ABI,
        functionName: 'setAuthorizedRSC',
        args: [rscAddress, true],
      });

      setAuthSuccess(true);
    } catch (err: any) {
      console.error('Vault authorization error:', err);
      setError(err.message || 'User rejected or transaction failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#110B1F]/95 border border-[#2E1E54] shadow-2xl p-6 text-slate-100 backdrop-blur-2xl">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-purple-300/60 hover:text-white p-1.5 rounded-full hover:bg-[#1B1233] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5 pb-3 border-b border-purple-900/30">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-purple-600/30">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Deploy Reactive Automation
            </h3>
            <p className="text-xs text-purple-300/70 mt-0.5">
              Autonomous execution on Reactive Lasna Testnet (Chain ID: 5318007)
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Initial Deploy Step */}
        {!deployResult ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#0D0819]/90 border border-purple-900/30 text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-purple-300/70">Pipeline Structure:</span>
                <span className="font-semibold text-white tabular-nums">{graph.nodes.length} Nodes &bull; {graph.edges.length} Edges</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-300/70">Gas Sponsorship:</span>
                <span className="font-bold text-emerald-400 tabular-nums">1.0 lREACT (Sponsored Free)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-300/70">Owner Signer:</span>
                <span className="font-mono text-violet-300">
                  {isConnected && userAddress ? truncateAddress(userAddress) : 'Default Demo Wallet'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-800/40 text-xs text-purple-300/90 flex gap-2.5">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-violet-400" />
              <span>
                Pre-compiled bytecode deploys in under 2 seconds on Lasna. No dynamic compilation stalls.
              </span>
            </div>

            <button
              onClick={handleDeploy}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold rounded-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deploying to Reactive Lasna...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  <span>Deploy to Reactive Lasna (1s)</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* Step 2: Post-Deploy Non-Custodial Authorization Prompt */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#0D0819]/90 border border-emerald-900/40 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                <span className="status-dot status-dot-emerald" />
                <span>RSC Successfully Deployed on Lasna</span>
              </div>
              <div className="space-y-1 font-mono text-[11px] text-purple-200">
                <div className="flex justify-between">
                  <span className="text-purple-400/70">Pipeline ID:</span>
                  <span className="text-cyan-300 font-bold">{deployResult.pipelineId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-400/70">RSC Contract:</span>
                  <span className="text-white">
                    {truncateAddress(deployResult.contracts?.rscAddress)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-400/70">Gas Tank:</span>
                  <span className="text-emerald-400 font-bold tabular-nums">1.0 lREACT (~5,000 Callbacks)</span>
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
            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-900/40 text-xs space-y-2.5">
              <div className="flex items-center gap-2 text-amber-300 font-semibold">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Non-Custodial Authorization (ActionVault)</span>
              </div>
              <p className="text-[11px] text-purple-200/80 leading-relaxed">
                To guarantee zero-trust non-custodial security, the owner signs 1 lightweight transaction calling <code className="text-amber-300 font-mono">setAuthorizedRSC()</code> on Base Sepolia.
              </p>
              {authSuccess ? (
                <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-800/50 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <span className="status-dot status-dot-emerald" />
                  <span>RSC is now officially Authorized on ActionVault!</span>
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

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-full bg-[#1B1233] hover:bg-[#251945] text-purple-200 hover:text-white border border-purple-800/40 text-xs font-medium transition-colors cursor-pointer"
            >
              Done & Return to Studio
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
