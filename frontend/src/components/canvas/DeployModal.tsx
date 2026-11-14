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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm select-none font-mono">
      <div className="tech-corner-accent relative w-full max-w-lg rounded-none bg-[#0B0813] border border-[#1C142E] shadow-2xl p-6 text-zinc-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-500 hover:text-white p-1 rounded-none hover:bg-[#110C1E] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-[#1C142E]">
          <div className="p-2.5 rounded-none bg-[#110C1E] border border-[#8B5CF6] text-[#8B5CF6]">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider">
              DEPLOY REACTIVE AUTOMATION
            </h3>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">
              REACTIVE LASNA TESTNET &bull; CHAIN ID: 5318007
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-none bg-[#16080E] border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span className="font-mono">{error}</span>
          </div>
        )}

        {/* Initial Deploy Step */}
        {!deployResult ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-none bg-[#06040A] border border-[#1C142E] text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-500 uppercase text-[10px]">PIPELINE NODES:</span>
                <span className="font-bold text-zinc-200 tabular-nums">{graph.nodes.length} NODES</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 uppercase text-[10px]">CONNECTIONS (DAG):</span>
                <span className="font-bold text-zinc-200 tabular-nums">{graph.edges.length} EDGES</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 uppercase text-[10px]">GAS SPONSORSHIP:</span>
                <span className="font-bold text-[#00FF9D] tabular-nums">1.0 lREACT (FREE)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 uppercase text-[10px]">OWNER WALLET:</span>
                <span className="text-[#C084FC]">
                  {isConnected && userAddress ? truncateAddress(userAddress) : 'DEFAULT DEMO WALLET'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-none bg-[#110C1E] border border-[#2E1F4A] text-[11px] text-zinc-300 flex gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-[#8B5CF6]" />
              <span>
                Pre-compiled parameterized bytecode deploys in under 2 seconds. Zero compilation stalls or dynamic AST bugs.
              </span>
            </div>

            <button
              onClick={handleDeploy}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider rounded-none border border-[#8B5CF6] bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-md shadow-[#8B5CF6]/20 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>DEPLOYING TO LASNA...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  <span>EXECUTE DEPLOY TO LASNA (1s)</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* Step 2: Post-Deploy Non-Custodial Authorization Prompt */
          <div className="space-y-4">
            <div className="p-4 rounded-none bg-[#06040A] border border-emerald-900/60 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <span className="status-pip status-pip-emerald" />
                <span>RSC SUCCESSFULLY DEPLOYED ON LASNA</span>
              </div>
              <div className="space-y-1 font-mono text-[11px] text-zinc-300">
                <div className="flex justify-between">
                  <span className="text-zinc-500 uppercase text-[10px]">PIPELINE ID:</span>
                  <span className="text-cyan-400 font-bold">{deployResult.pipelineId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 uppercase text-[10px]">RSC CONTRACT:</span>
                  <span className="text-zinc-200">
                    {truncateAddress(deployResult.contracts?.rscAddress)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 uppercase text-[10px]">SPONSORED GAS:</span>
                  <span className="text-emerald-400 font-bold tabular-nums">1.0 lREACT (~5,000 CALLBACKS)</span>
                </div>
              </div>

              {deployResult.explorerUrls?.reactscan && (
                <a
                  href={deployResult.explorerUrls.reactscan}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 uppercase tracking-wider pt-1"
                >
                  <span>VIEW ON REACTSCAN EXPLORER</span> <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Non-Custodial Step */}
            <div className="p-3.5 rounded-none bg-[#110C1E] border border-amber-900/50 text-xs space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>NON-CUSTODIAL AUTHORIZATION (ACTIONVAULT)</span>
              </div>
              <p className="text-[11px] text-zinc-300 font-sans">
                To guarantee zero-trust non-custodial security, the owner must sign 1 lightweight transaction calling <code className="text-amber-300 font-mono">setAuthorizedRSC()</code> on Base Sepolia.
              </p>
              {authSuccess ? (
                <div className="p-2 rounded-none bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs font-bold uppercase tracking-wide flex items-center gap-2">
                  <span className="status-pip status-pip-emerald" />
                  <span>RSC IS NOW AUTHORIZED ON ACTIONVAULT</span>
                </div>
              ) : (
                <button
                  onClick={handleAuthorizeVault}
                  disabled={isAuthPending}
                  className="w-full py-2.5 px-3 rounded-none bg-[#F59E0B] hover:bg-[#D97706] text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {isAuthPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>SIGNING ON METAMASK...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>AUTHORIZE RSC ON ACTIONVAULT</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full py-2 rounded-none bg-[#110C1E] hover:bg-[#1A102E] text-zinc-300 hover:text-white border border-[#2E1F4A] hover:border-[#8B5CF6] text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              DONE & RETURN TO STUDIO
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
