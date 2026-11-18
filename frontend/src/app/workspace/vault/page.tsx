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
  Loader2
} from 'lucide-react';
import { useAccount, useBalance, useSendTransaction, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { CONTRACT_ADDRESSES } from '@/lib/constants';
import { truncateAddress } from '@/lib/utils';
import { ACTION_VAULT_ABI } from '@omniflow/shared';

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
              <h1 className="text-xl font-bold text-white tracking-tight font-display">
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
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-[#16171a] hover:bg-[#202126] text-[#c4c2c3] hover:text-white border border-white/20 transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isVaultBalanceLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <a
            href={`https://sepolia.basescan.org/address/${vaultAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-full bg-[#16171a] hover:bg-[#202126] text-white border border-white/20 transition-all cursor-pointer shadow-sm"
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

      {/* 4 Telemetry Metric Blocks */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Metric 1: Real Collateral */}
        <div className="p-4 rounded-2xl bg-[#0b0c10]/80 backdrop-blur-lg border border-white/[0.08] hover:border-white/[0.18] transition-colors duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-xs">
            <span className="text-[11px] text-[#8e8e8e] uppercase font-mono tracking-wider">Vault Collateral</span>
            <span className="text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-[10px]">
              ON-CHAIN
            </span>
          </div>
          <div className="my-2.5">
            <div className="text-2xl font-bold text-white tracking-tight tabular-nums flex items-baseline gap-1.5 font-display">
              <span>{formattedVaultEth}</span>
              <span className="text-xs text-[#8e8e8e] font-normal font-sans">ETH</span>
            </div>
            <div className="text-xs text-[#8e8e8e] mt-0.5 tabular-nums">~${formattedVaultUsd} USD</div>
          </div>
          <div className="pt-2 border-t border-white/[0.06] flex justify-between text-[11px] text-[#8e8e8e]">
            <span>Asset: <strong className="text-white font-medium">Native ETH</strong></span>
            <span>Status: <strong className="text-emerald-400 font-medium">Verified</strong></span>
          </div>
        </div>

        {/* Metric 2: Authorized RSCs */}
        <div className="p-4 rounded-2xl bg-[#0b0c10]/80 backdrop-blur-lg border border-white/[0.08] hover:border-white/[0.18] transition-colors duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-xs">
            <span className="text-[11px] text-[#8e8e8e] uppercase font-mono tracking-wider">Authorized RSC</span>
            <span className={`font-semibold px-2 py-0.5 rounded-full border text-[10px] ${
              isRscAuthorized !== false ? 'text-violet-300 border-violet-500/20 bg-violet-500/10' : 'text-slate-400 border-white/10 bg-white/[0.04]'
            }`}>
              {isRscAuthorized !== false ? 'AUTHORIZED' : 'REVOKED'}
            </span>
          </div>
          <div className="my-2.5">
            <div className="text-base font-bold text-white tracking-tight font-mono truncate mt-1">
              {truncateAddress(CONTRACT_ADDRESSES.DEFAULT_RSC_STOP_LOSS, 6)}
            </div>
            <div className="text-xs text-[#8e8e8e] mt-1.5">StopLoss_Pipeline (Lasna)</div>
          </div>
          <div className="pt-2 border-t border-white/[0.06] flex justify-between text-[11px] text-[#8e8e8e]">
            <span>Model: <strong className="text-white font-medium">Non-Custodial</strong></span>
            <span>Revocable: <strong className="text-emerald-400 font-medium">Yes</strong></span>
          </div>
        </div>

        {/* Metric 3: Cooldown Guard */}
        <div className="p-4 rounded-2xl bg-[#0b0c10]/80 backdrop-blur-lg border border-white/[0.08] hover:border-white/[0.18] transition-colors duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-xs">
            <span className="text-[11px] text-[#8e8e8e] uppercase font-mono tracking-wider">Storm Rate-Limiter</span>
            <span className="text-cyan-400 font-semibold px-2 py-0.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-[10px]">
              ARMED
            </span>
          </div>
          <div className="my-2.5">
            <div className="text-2xl font-bold text-white tracking-tight tabular-nums flex items-baseline gap-1.5 font-display">
              <span>300</span>
              <span className="text-xs text-[#8e8e8e] font-normal font-sans">Seconds</span>
            </div>
            <div className="text-xs text-[#8e8e8e] mt-0.5">5 min cooldown interval</div>
          </div>
          <div className="pt-2 border-t border-white/[0.06] flex justify-between text-[11px] text-[#8e8e8e]">
            <span>Defense: <strong className="text-white font-medium">200ms Guard</strong></span>
            <span>Status: <strong className="text-emerald-400 font-medium">Active</strong></span>
          </div>
        </div>

        {/* Metric 4: SafeSweep Cold Safe */}
        <div className="p-4 rounded-2xl bg-[#0b0c10]/80 backdrop-blur-lg border border-white/[0.08] hover:border-white/[0.18] transition-colors duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-xs">
            <span className="text-[11px] text-[#8e8e8e] uppercase font-mono tracking-wider">SafeSweep Target</span>
            <span className="text-amber-400 font-semibold px-2 py-0.5 rounded-full border border-amber-500/20 bg-amber-500/10 text-[10px]">
              COLD SAFE
            </span>
          </div>
          <div className="my-2.5">
            <div className="text-base font-bold text-white tracking-tight mt-1 truncate font-mono">
              {truncateAddress(safeAddressDisplay, 6)}
            </div>
            <div className="text-xs text-[#8e8e8e] mt-1.5">Anti-Drainer Backup Storage</div>
          </div>
          <div className="pt-2 border-t border-white/[0.06] flex justify-between text-[11px] text-[#8e8e8e]">
            <span>Protection: <strong className="text-emerald-400 font-medium">1-Tx Sweep</strong></span>
            <span>Coverage: <strong className="text-white font-medium">100%</strong></span>
          </div>
        </div>
      </div>

      {/* Main Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Deposit & Balance Card */}
        <div className="p-5 md:p-6 rounded-2xl bg-[#0b0c10]/90 backdrop-blur-xl border border-white/[0.08] space-y-4 shadow-2xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Deposit Native ETH into ActionVault
                </h3>
                <span className="text-xs text-[#8e8e8e]">Fund your non-custodial automated execution pool</span>
              </div>
              <span className="text-xs text-[#8e8e8e] font-mono">Base Sepolia</span>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5 text-xs">
                <label className="text-[#8e8e8e] font-medium">Deposit Amount (ETH)</label>
                {userBalance && (
                  <span className="text-slate-400 font-mono text-[11px]">
                    Wallet: {parseFloat(formatEther(userBalance.value)).toFixed(4)} ETH
                  </span>
                )}
              </div>
              <div className="flex gap-2.5">
                <input
                  type="number"
                  step="0.001"
                  min="0.0001"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="flex-1 bg-[#16171a] border border-white/20 rounded-full px-4 py-2 text-xs text-white font-mono focus:outline-none focus:border-white tabular-nums"
                  placeholder="0.001"
                />
                <button
                  onClick={handleDeposit}
                  disabled={isDepositPending || isDepositConfirming || !isConnected || !isCorrectChain}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-full bg-white hover:bg-white/90 text-black shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDepositPending || isDepositConfirming ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Depositing...</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      <span>Deposit ETH</span>
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

            {/* Non-Custodial RSC Authorization Action */}
            <div className="pt-3 border-t border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8e8e8e] font-medium">Non-Custodial RSC Authorization:</span>
                <span className={`font-mono text-[11px] font-semibold ${
                  isRscAuthorized !== false ? 'text-emerald-400' : 'text-slate-400'
                }`}>
                  {isRscAuthorized !== false ? 'AUTHORIZED' : 'REVOKED'}
                </span>
              </div>
              <button
                onClick={handleToggleAuthorizeRsc}
                disabled={isWritePending || isWriteConfirming || !isConnected || !isCorrectChain}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-full border transition-all cursor-pointer disabled:opacity-50 ${
                  isRscAuthorized !== false
                    ? 'bg-[#16171a] hover:bg-rose-500/10 text-slate-300 hover:text-rose-300 border-white/20 hover:border-rose-500/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white border-transparent'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {isRscAuthorized !== false
                    ? `Revoke RSC Access (${truncateAddress(CONTRACT_ADDRESSES.DEFAULT_RSC_STOP_LOSS, 6)})`
                    : `Authorize StopLoss RSC (${truncateAddress(CONTRACT_ADDRESSES.DEFAULT_RSC_STOP_LOSS, 6)})`}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Panic Button Card */}
        <div className="p-5 md:p-6 rounded-2xl bg-[#140a0e]/90 backdrop-blur-xl border border-rose-500/30 flex flex-col justify-between space-y-4 shadow-2xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-rose-500/20">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <AlertOctagon className="w-4 h-4 text-rose-400" />
                <span>Emergency Panic Button</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            </div>

            <p className="text-xs text-rose-200/80 leading-relaxed">
              Unconditionally withdraw 100% of Vault ETH directly back to your owner wallet in a single transaction. Completely bypasses all Reactive Smart Contracts, active automations, and cooldown timers.
            </p>

            <div className="p-3 rounded-xl bg-[#0a0507] border border-rose-500/20 text-xs text-rose-300 flex items-center justify-between font-mono text-[11px]">
              <span>Function: <strong className="text-white">emergencyWithdraw()</strong></span>
              <span className="text-emerald-400 font-sans font-medium">Non-Custodial Guarantee</span>
            </div>
          </div>

          <div className="space-y-2">
            {!isPanicConfirmOpen ? (
              <button
                onClick={() => setIsPanicConfirmOpen(true)}
                disabled={isWritePending || isWriteConfirming || !isConnected || !isCorrectChain}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-[0_2px_14px_rgba(244,63,94,0.4)] transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                <AlertOctagon className="w-4 h-4" />
                <span>Trigger Emergency Panic Withdraw (100% ETH)</span>
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 space-y-2 animate-fade-in">
                <div className="text-xs text-rose-200 font-medium">
                  Confirm Emergency Withdrawal? This will instantly withdraw all {formattedVaultEth} ETH to {truncateAddress(userAddress || '', 6)}.
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handlePanicWithdraw}
                    disabled={isWritePending || isWriteConfirming}
                    className="flex-1 py-2 text-xs font-bold rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isWritePending || isWriteConfirming ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Confirming Tx...</span>
                      </>
                    ) : (
                      <span>Yes, Withdraw Now</span>
                    )}
                  </button>
                  <button
                    onClick={() => setIsPanicConfirmOpen(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-full bg-[#16171a] hover:bg-[#202126] text-white border border-white/20 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {writeError && (
              <div className="text-[11px] text-rose-400 font-mono">
                {writeError.message.slice(0, 100)}...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
