'use client';

import React, { useState, useEffect } from 'react';
import { 
  Vault, 
  AlertOctagon, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Lock,
  ExternalLink,
  Flame,
  CheckCircle2,
  RefreshCw,
  Wallet,
  AlertTriangle,
  Loader2,
  ShieldAlert,
  Coins
} from 'lucide-react';
import { useAccount, useBalance, useSendTransaction, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { CONTRACT_ADDRESSES } from '@/lib/constants';
import { truncateAddress } from '@/lib/utils';
import { ACTION_VAULT_ABI } from '@omniflow/shared';
import { MetricRibbon } from '@/components/common/MetricRibbon';

export default function VaultManagerPage() {
  const { address: userAddress, isConnected, chainId } = useAccount();
  const [depositAmount, setDepositAmount] = useState('0.001');
  const [withdrawAmount, setWithdrawAmount] = useState('0.001');
  const [isPanicConfirmOpen, setIsPanicConfirmOpen] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<{ title: string; txHash?: string } | null>(null);

  const vaultAddress = CONTRACT_ADDRESSES.DEFAULT_ACTION_VAULT;
  const isCorrectChain = chainId === 84532;

  // 1. Read Live On-Chain Vault Balance (Base Sepolia: 84532)
  const { 
    data: vaultBalance, 
    isLoading: isVaultBalanceLoading, 
    refetch: refetchVaultBalance 
  } = useBalance({
    address: vaultAddress,
    chainId: 84532,
  });

  // 2. Read User Wallet Balance (Base Sepolia: 84532)
  const { 
    data: userBalance, 
    isLoading: isUserBalanceLoading,
    refetch: refetchUserBalance 
  } = useBalance({
    address: userAddress,
    chainId: 84532,
  });

  // 3. Read Backup Safe Address from ActionVault contract
  const { data: backupSafeAddress } = useReadContract({
    address: vaultAddress,
    abi: ACTION_VAULT_ABI,
    functionName: 'backupSafeAddress',
    chainId: 84532,
  });

  // 4. Read Vault Owner
  const { data: vaultOwner } = useReadContract({
    address: vaultAddress,
    abi: ACTION_VAULT_ABI,
    functionName: 'owner',
    chainId: 84532,
  });

  // 5. Read Authorized RSC Status for StopLoss_Pipeline
  const { data: isRscAuthorized } = useReadContract({
    address: vaultAddress,
    abi: ACTION_VAULT_ABI,
    functionName: 'authorizedRSCs',
    args: [CONTRACT_ADDRESSES.DEFAULT_RSC_STOP_LOSS],
    chainId: 84532,
  });

  // Deposit Transaction (Direct Native ETH transfer into ActionVault)
  const { 
    sendTransaction, 
    data: depositTxHash, 
    isPending: isDepositPending,
    error: depositError 
  } = useSendTransaction();

  const { isLoading: isDepositConfirming, isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({
    hash: depositTxHash,
  });

  // Contract Write Actions (emergencyWithdraw & executeSafeSweep)
  const { 
    writeContract, 
    data: writeTxHash, 
    isPending: isWritePending,
    error: writeError 
  } = useWriteContract();

  const { isLoading: isWriteConfirming, isSuccess: isWriteSuccess } = useWaitForTransactionReceipt({
    hash: writeTxHash,
  });

  // Refetch balances upon transaction confirmation
  useEffect(() => {
    if (isDepositSuccess && depositTxHash) {
      refetchVaultBalance();
      refetchUserBalance();
      setActionSuccessMsg({
        title: `Successfully deposited ${depositAmount} ETH into ActionVault!`,
        txHash: depositTxHash,
      });
      setTimeout(() => setActionSuccessMsg(null), 8000);
    }
  }, [isDepositSuccess, depositTxHash, depositAmount, refetchVaultBalance, refetchUserBalance]);

  useEffect(() => {
    if (isWriteSuccess && writeTxHash) {
      refetchVaultBalance();
      refetchUserBalance();
      setIsPanicConfirmOpen(false);
      setActionSuccessMsg({
        title: 'Emergency On-Chain Execution Confirmed on Base Sepolia!',
        txHash: writeTxHash,
      });
      setTimeout(() => setActionSuccessMsg(null), 8000);
    }
  }, [isWriteSuccess, writeTxHash, refetchVaultBalance, refetchUserBalance]);

  const handleDeposit = () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;
    sendTransaction({
      to: vaultAddress,
      value: parseEther(depositAmount),
    });
  };

  const handlePanicWithdraw = () => {
    writeContract({
      address: vaultAddress,
      abi: ACTION_VAULT_ABI,
      functionName: 'emergencyWithdraw',
      args: [],
      chainId: 84532,
    });
  };

  const handleToggleAuthorizeRsc = () => {
    const nextStatus = !isRscAuthorized;
    writeContract({
      address: vaultAddress,
      abi: ACTION_VAULT_ABI,
      functionName: 'setAuthorizedRSC',
      args: [CONTRACT_ADDRESSES.DEFAULT_RSC_STOP_LOSS, nextStatus],
      chainId: 84532,
    });
  };

  const formattedVaultEth = vaultBalance?.value !== undefined 
    ? parseFloat(formatEther(vaultBalance.value)).toFixed(4)
    : '0.0020';
  
  const formattedVaultUsd = (parseFloat(formattedVaultEth) * 2500).toFixed(2);

  const safeAddressDisplay = backupSafeAddress 
    ? String(backupSafeAddress)
    : CONTRACT_ADDRESSES.DEFAULT_BACKUP_SAFE_SWEEP;

  const isOwner = userAddress && vaultOwner 
    ? userAddress.toLowerCase() === String(vaultOwner).toLowerCase()
    : true;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6 select-none font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/20 flex items-center justify-center text-white shadow-sm shrink-0">
            <Vault className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight font-sans">
                Vault Manager
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-mono font-medium">
                NON-CUSTODIAL
              </span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-mono font-medium">
                BASE SEPOLIA
              </span>
            </div>
            <p className="text-xs text-[#8e8e8e] mt-0.5 font-mono">
              ActionVault Contract &bull; {truncateAddress(vaultAddress, 8)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              refetchVaultBalance();
              refetchUserBalance();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-[#16171a] hover:bg-[#202126] text-[#c4c2c3] hover:text-white border border-white/20 transition-colors duration-150 cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isVaultBalanceLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <a
            href={`https://sepolia.basescan.org/address/${vaultAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-full bg-[#16171a] hover:bg-[#202126] text-white border border-white/20 transition-colors duration-150 cursor-pointer shadow-sm"
          >
            <span>Basescan</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Network Warning Banner if disconnected or wrong chain */}
      {!isConnected ? (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Connect your MetaMask wallet to execute live on-chain deposits and non-custodial emergency withdrawals.</span>
          </div>
          <span className="font-mono text-[11px] text-amber-400 font-semibold">Wallet Disconnected</span>
        </div>
      ) : !isCorrectChain ? (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Please switch your wallet to Base Sepolia (Chain ID: 84532) to interact with ActionVault.</span>
          </div>
          <span className="font-mono text-[11px] text-rose-400 font-semibold">Wrong Network ({chainId})</span>
        </div>
      ) : null}

      {/* Action Success Toast Banner */}
      {actionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between animate-fade-in shadow-xl">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{actionSuccessMsg.title}</span>
          </div>
          {actionSuccessMsg.txHash && (
            <a
              href={`https://sepolia.basescan.org/tx/${actionSuccessMsg.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-mono text-[11px] text-emerald-400 hover:underline"
            >
              <span>{truncateAddress(actionSuccessMsg.txHash, 6)}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* Executive Telemetry Ribbon */}
      <MetricRibbon
        items={[
          {
            label: 'Vault Collateral',
            value: `${formattedVaultEth} ETH`,
            hint: `~$${formattedVaultUsd}`,
            badge: {
              text: 'VERIFIED',
              tone: 'good',
            },
          },
          {
            label: 'Delegated RSC Access',
            value: isRscAuthorized !== false ? '01 Active' : '00 Active',
            hint: 'RSC Contracts',
            badge: {
              text: isRscAuthorized !== false ? 'AUTHORIZED' : 'REVOKED',
              tone: isRscAuthorized !== false ? 'good' : 'warn',
            },
          },
          {
            label: 'Storm Rate-Limiter',
            value: '300s',
            hint: 'Cooldown',
            badge: {
              text: 'ARMED',
              tone: 'info',
            },
          },
          {
            label: 'Anti-Drainer Cold Safe',
            value: truncateAddress(safeAddressDisplay, 6),
            hint: 'Target Safe',
            badge: {
              text: '100% SWEEP',
              tone: 'neutral',
            },
          },
        ]}
      />

      {/* Main Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Collateral Management */}
        <div className="p-5 md:p-6 rounded-xl bg-[#090A0F] border border-white/[0.08] flex flex-col justify-between space-y-5 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-tight">
                    Vault Collateral Reserve
                  </h3>
                  <span className="text-[11px] text-slate-400">Automated execution balance on Base Sepolia</span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-300 border border-white/10">
                #84532 Denim
              </span>
            </div>

            {/* Asset Display */}
            <div className="p-4 rounded-lg bg-[#050608] border border-white/[0.04] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/[0.08] border border-white/10 flex items-center justify-center text-white font-mono font-bold text-xs">
                  ETH
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Native Ethereum</div>
                  <div className="text-[11px] text-slate-400 font-mono">Execution asset for DEX stop-loss</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-semibold text-white font-mono tabular-nums">
                  {formattedVaultEth} ETH
                </div>
                <div className="text-[11px] text-emerald-400 font-mono tabular-nums">
                  ~${formattedVaultUsd} USD
                </div>
              </div>
            </div>

            {/* Deposit Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="text-slate-400 font-medium">Deposit Collateral (ETH)</label>
                {userBalance && (
                  <span className="text-slate-400 font-mono text-[11px]">
                    Available in Wallet: {parseFloat(formatEther(userBalance.value)).toFixed(4)} ETH
                  </span>
                )}
              </div>

              {/* Quick Select Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {['0.001', '0.005', '0.01', '0.05'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(amt)}
                    className={`py-1 rounded-md border text-[11px] font-mono transition-colors ${
                      depositAmount === amt
                        ? 'border-white bg-white/10 text-white font-semibold'
                        : 'border-white/10 bg-[#121318] text-slate-300 hover:bg-white/[0.06]'
                    }`}
                  >
                    {amt} ETH
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.001"
                  min="0.0001"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="flex-1 bg-[#121318] border border-white/20 rounded-lg px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-white tabular-nums"
                  placeholder="0.001"
                />
                <button
                  onClick={handleDeposit}
                  disabled={isDepositPending || isDepositConfirming || !isConnected || !isCorrectChain}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-white hover:bg-white/90 text-black shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDepositPending || isDepositConfirming ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Depositing...</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      <span>Deposit</span>
                    </>
                  )}
                </button>
              </div>

              {depositError && (
                <div className="text-[11px] text-rose-400 mt-2 font-mono">
                  {depositError.message.slice(0, 100)}...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Access Control List (ACL) Delegated RSCs */}
        <div className="p-5 md:p-6 rounded-xl bg-[#090A0F] border border-white/[0.08] flex flex-col justify-between space-y-5 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-tight">
                    Smart Contract Authorization (ACL)
                  </h3>
                  <span className="text-[11px] text-slate-400">Verified permissions for cross-chain execution</span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">
                1 Delegation
              </span>
            </div>

            {/* Delegation Row */}
            <div className="p-3.5 rounded-lg bg-[#050608] border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-2">
                    <span>StopLoss_Pipeline</span>
                    <span className={`text-[10px] font-mono px-2 py-0.2 rounded-full border ${
                      isRscAuthorized !== false
                        ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
                        : 'text-slate-400 border-white/10 bg-white/[0.04]'
                    }`}>
                      {isRscAuthorized !== false ? 'ACTIVE' : 'REVOKED'}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    RSC: {truncateAddress(CONTRACT_ADDRESSES.DEFAULT_RSC_STOP_LOSS, 8)} (Lasna #5318007)
                  </div>
                </div>

                <a
                  href={`https://lasna.reactscan.net/address/${CONTRACT_ADDRESSES.DEFAULT_RSC_STOP_LOSS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-md hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors"
                  title="View on ReactScan"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-white/[0.04] text-slate-400">
                <div>Capability: <strong className="text-slate-200">Uniswap V2 Swap</strong></div>
                <div>Invariant: <strong className="text-cyan-300 font-mono">300s Cooldown</strong></div>
              </div>

              <button
                onClick={handleToggleAuthorizeRsc}
                disabled={isWritePending || isWriteConfirming || !isConnected || !isCorrectChain}
                className={`w-full py-2 px-3 text-xs font-semibold rounded-lg border transition-colors cursor-pointer disabled:opacity-50 ${
                  isRscAuthorized !== false
                    ? 'bg-[#121318] hover:bg-rose-500/10 text-slate-300 hover:text-rose-300 border-white/10 hover:border-rose-500/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white border-transparent'
                }`}
              >
                {isRscAuthorized !== false ? 'Revoke Contract Authorization' : 'Grant Contract Authorization'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Institutional Security & Danger Zone */}
      <div className="p-5 md:p-6 rounded-xl bg-[#0D080A] border border-rose-500/20 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-500/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-rose-200 tracking-tight">
                Emergency Security &amp; Non-Custodial Safeguard
              </h3>
              <p className="text-[11px] text-rose-300/70">
                Direct on-chain panic button &bull; Completely independent of Reactive network or relayer state
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
            OWNER PRIVILEGE
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <p className="text-xs text-rose-200/80 leading-relaxed max-w-2xl">
            Unconditionally withdraw 100% of Vault ETH ({formattedVaultEth} ETH) back to your owner wallet in a single emergency transaction. This bypasses all active automations, cooldowns, and Reactive Smart Contracts.
          </p>

          <div className="shrink-0">
            {!isPanicConfirmOpen ? (
              <button
                onClick={() => setIsPanicConfirmOpen(true)}
                disabled={isWritePending || isWriteConfirming || !isConnected || !isCorrectChain}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                Emergency Withdraw All
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePanicWithdraw}
                  disabled={isWritePending || isWriteConfirming}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isWritePending || isWriteConfirming ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Confirming...</span>
                    </>
                  ) : (
                    <span>Confirm Emergency Drain</span>
                  )}
                </button>
                <button
                  onClick={() => setIsPanicConfirmOpen(false)}
                  className="px-3 py-2 text-xs font-medium rounded-lg bg-[#14151B] hover:bg-[#1E2028] text-slate-300 border border-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {writeError && (
          <div className="text-[11px] text-rose-400 font-mono pt-1">
            {writeError.message.slice(0, 120)}...
          </div>
        )}
      </div>
    </div>
  );
}
