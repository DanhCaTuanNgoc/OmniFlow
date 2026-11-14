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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0F172A] border border-slate-800 shadow-2xl p-6 text-slate-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-100 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Rocket className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Deploy Reactive Automation</h3>
            <p className="text-xs text-slate-400">
              Autonomous execution on Reactive Lasna Testnet (Chain ID: 5318007)
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Initial Deploy Step */}
        {!deployResult ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Pipeline Nodes:</span>
                <span className="font-mono font-bold text-slate-200">{graph.nodes.length} Nodes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Connections (DAG):</span>
                <span className="font-mono font-bold text-slate-200">{graph.edges.length} Edges</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Gas Sponsorship:</span>
                <span className="font-mono font-bold text-emerald-400">1.0 lREACT (Free)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Owner Wallet:</span>
                <span className="font-mono text-cyan-400">
                  {isConnected && userAddress ? truncateAddress(userAddress) : 'Default Demo Wallet'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-900/40 text-[11px] text-cyan-300 flex gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Pre-compiled parameterized bytecode deploys in under 2 seconds. No compilation stalls or dynamic AST bugs.
              </span>
            </div>

            <button
              onClick={handleDeploy}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deploying to Lasna...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  Deploy to Reactive Lasna (1s)
                </>
              )}
            </button>
          </div>
        ) : (
          /* Step 2: Post-Deploy Non-Custodial Authorization Prompt */
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/50 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                RSC Successfully Deployed on Lasna!
              </div>
              <div className="space-y-1 font-mono text-[11px] text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Pipeline ID:</span>
                  <span className="text-cyan-400">{deployResult.pipelineId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">RSC Contract:</span>
                  <span className="text-slate-200">
                    {truncateAddress(deployResult.contracts?.rscAddress)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sponsored Gas:</span>
                  <span className="text-emerald-400">1.0 lREACT (~5,000 Callbacks)</span>
                </div>
              </div>

              {deployResult.explorerUrls?.reactscan && (
                <a
                  href={deployResult.explorerUrls.reactscan}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:underline pt-1"
                >
                  View on ReactScan Explorer <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Non-Custodial Step */}
            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-900/50 text-xs space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-semibold">
                <KeyRound className="w-4 h-4 text-amber-400" />
                Non-Custodial Authorization (ActionVault)
              </div>
              <p className="text-[11px] text-slate-300">
                To guarantee zero-trust non-custodial security, the owner must sign 1 lightweight
                transaction calling <code className="text-amber-300">setAuthorizedRSC()</code> on Base Sepolia.
              </p>
              {authSuccess ? (
                <div className="p-2 rounded-lg bg-emerald-900/40 border border-emerald-700/50 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  RSC is now officially Authorized on ActionVault!
                </div>
              ) : (
                <button
                  onClick={handleAuthorizeVault}
                  disabled={isAuthPending}
                  className="w-full py-2.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  {isAuthPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Sign on MetaMask...
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      Authorize RSC on ActionVault (Owner Signature)
                    </>
                  )}
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Done & Return to Studio
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
