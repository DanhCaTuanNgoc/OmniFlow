'use client';

import React, { useState, useEffect } from 'react';
import { WorkspacePageHeader, WorkspaceState } from '@/components/common/WorkspaceUI';
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
import { parseEther, formatEther, isAddress, isAddressEqual, type Address } from 'viem';
import { CONTRACT_ADDRESSES } from '@/lib/constants';
import { truncateAddress } from '@/lib/utils';
import { ACTION_VAULT_ABI } from '@omniflow/shared';

export default function VaultManagerPage() {
  const { address, isConnected } = useAccount();
  return <VaultForWallet key={isConnected ? address : 'guest'} userAddress={isConnected ? address : undefined} />;
}

function VaultForWallet({ userAddress }: { userAddress?: Address }) {
  const { chainId } = useAccount();
  const isConnected = Boolean(userAddress);
  const [depositAmount, setDepositAmount] = useState('0.001');
  const [isPanicConfirmOpen, setIsPanicConfirmOpen] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<{ title: string; txHash?: string } | null>(null);

  const vaultAddress = CONTRACT_ADDRESSES.DEFAULT_ACTION_VAULT;
  const vaultConfigured = isAddress(vaultAddress);
  const isCorrectChain = chainId === 84532;

  // 4. Read Vault Owner
  const { data: vaultOwner, isError: ownerError, isPending: ownerPending } = useReadContract({
    address: vaultAddress,
    abi: ACTION_VAULT_ABI,
    functionName: 'owner',
    chainId: 84532,
    query: { enabled: isConnected && vaultConfigured },
  });

  const isOwner = Boolean(userAddress && vaultOwner && !ownerError && isAddressEqual(userAddress, vaultOwner));
  const canWrite = isOwner && isCorrectChain;

  // 1. Read Live On-Chain Vault Balance (Base Sepolia: 84532)
  const { 
    data: vaultBalance,
    isError: vaultBalanceError,
    isLoading: isVaultBalanceLoading, 
    refetch: refetchVaultBalance 
  } = useBalance({
    address: vaultAddress,
    chainId: 84532,
    query: { enabled: isOwner },
  });

  // 2. Read User Wallet Balance (Base Sepolia: 84532)
  const { 
    data: userBalance, 
    isLoading: isUserBalanceLoading,
    refetch: refetchUserBalance 
  } = useBalance({
    address: userAddress,
    chainId: 84532,
    query: { enabled: isOwner },
  });

  // 3. Read Backup Safe Address from ActionVault contract
  const { data: backupSafeAddress } = useReadContract({
    address: vaultAddress,
    abi: ACTION_VAULT_ABI,
    functionName: 'backupSafeAddress',
    chainId: 84532,
    query: { enabled: isOwner },
  });

  // 5. Read Authorized RSC Status for StopLoss_Pipeline
  const { data: isRscAuthorized, isError: authorizationError, refetch: refetchAuthorization } = useReadContract({
    address: vaultAddress,
    abi: ACTION_VAULT_ABI,
    functionName: 'authorizedRSCs',
    args: [CONTRACT_ADDRESSES.DEFAULT_RSC_STOP_LOSS],
    chainId: 84532,
    query: { enabled: isOwner },
  });

  // Deposit Transaction (Direct Native ETH transfer into ActionVault)
  const { 
    sendTransaction, 
    data: depositTxHash, 
    isPending: isDepositPending,
    error: depositError 
  } = useSendTransaction();

  const { isLoading: isDepositConfirming, data: depositReceipt } = useWaitForTransactionReceipt({
    hash: depositTxHash,
    chainId: 84532,
  });

  // Contract Write Actions (emergencyWithdraw & executeSafeSweep)
  const { 
    writeContract, 
    data: writeTxHash, 
    isPending: isWritePending,
    error: writeError 
  } = useWriteContract();

  const { isLoading: isWriteConfirming, data: writeReceipt } = useWaitForTransactionReceipt({
    hash: writeTxHash,
    chainId: 84532,
  });

  // Refetch balances upon transaction confirmation
  useEffect(() => {
    if (depositReceipt?.status === 'success' && depositTxHash) {
      refetchVaultBalance();
      refetchUserBalance();
      setActionSuccessMsg({
        title: 'Vault deposit confirmed on Base Sepolia.',
        txHash: depositTxHash,
      });
      setTimeout(() => setActionSuccessMsg(null), 8000);
    }
  }, [depositReceipt, depositTxHash, depositAmount, refetchVaultBalance, refetchUserBalance]);

  useEffect(() => {
    if (writeReceipt?.status === 'success' && writeTxHash) {
      refetchVaultBalance();
      refetchUserBalance();
      refetchAuthorization();
      setIsPanicConfirmOpen(false);
      setActionSuccessMsg({
        title: 'Vault transaction confirmed on Base Sepolia.',
        txHash: writeTxHash,
      });
      setTimeout(() => setActionSuccessMsg(null), 8000);
    }
  }, [writeReceipt, writeTxHash, refetchVaultBalance, refetchUserBalance, refetchAuthorization]);

  const handleDeposit = () => {
    if (!canWrite || !userAddress || !/^\d+(\.\d{1,18})?$/.test(depositAmount) || parseEther(depositAmount) <= 0n) return;
    sendTransaction({
      to: vaultAddress,
      chainId: 84532,
      account: userAddress,
      value: parseEther(depositAmount),
    });
  };

  const handlePanicWithdraw = () => {
    if (!canWrite || !userAddress) return;
    writeContract({
      address: vaultAddress,
      account: userAddress,
      abi: ACTION_VAULT_ABI,
      functionName: 'emergencyWithdraw',
      args: [],
      chainId: 84532,
    });
  };

  const handleToggleAuthorizeRsc = () => {
    if (!canWrite || !userAddress || isRscAuthorized === undefined || authorizationError) return;
    const nextStatus = !isRscAuthorized;
    writeContract({
      address: vaultAddress,
      account: userAddress,
      abi: ACTION_VAULT_ABI,
      functionName: 'setAuthorizedRSC',
      args: [CONTRACT_ADDRESSES.DEFAULT_RSC_STOP_LOSS, nextStatus],
      chainId: 84532,
    });
  };

  const formattedVaultEth = vaultBalance && !vaultBalanceError ? formatEther(vaultBalance.value) : undefined;

  if (!isOwner) {
    return (
      <div className="ws-page">
        <WorkspacePageHeader title="Vault Manager" description="Manage collateral and Reactive contract permissions on Base Sepolia." />
        <WorkspaceState title={
          !isConnected ? 'Connect a wallet to view your Vault.' :
            !vaultConfigured ? 'The configured Vault address is invalid.' :
            ownerError ? 'Unable to verify Vault ownership.' :
            ownerPending ? 'Checking Vault ownership...' : 'No verified Vault is linked to this wallet.'
        } description={ownerError ? 'Check the configured address and the Base Sepolia RPC connection.' : undefined} />
      </div>
    );
  }

  return (
    <div className="ws-page">
      <WorkspacePageHeader
        title="Vault Manager"
        description={`Base Sepolia / ${truncateAddress(vaultAddress, 8)}`}
        actions={<>
          <button type="button" className="ws-button" onClick={() => {
            refetchVaultBalance();
            refetchUserBalance();
            refetchAuthorization();
          }}>
            <RefreshCw size={14} className={isVaultBalanceLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <a className="ws-button" href={`https://sepolia.basescan.org/address/${vaultAddress}`}
            target="_blank" rel="noopener noreferrer">Basescan <ExternalLink size={13} /></a>
        </>}
      />

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

      {vaultBalanceError && <p role="status" className="text-sm text-amber-300">Unable to read the Vault balance.</p>}
      {backupSafeAddress && <p className="text-xs text-slate-300">Backup wallet {backupSafeAddress}</p>}

      {/* Main Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Collateral Management */}
        <div className="ws-panel min-w-0 p-4 sm:p-5 space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-tight">
                    Collateral
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
                  {formattedVaultEth !== undefined ? `${formattedVaultEth} ETH` : '?'}
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
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
                  className="min-w-0 flex-1 bg-[#121318] border border-white/20 rounded-lg px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-white tabular-nums"
                  placeholder="0.001"
                />
                <button
                  onClick={handleDeposit}
                  disabled={isDepositPending || isDepositConfirming || !canWrite}
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

              {depositReceipt?.status === 'reverted' && <p role="alert">Vault deposit reverted.</p>}
              {depositError && (
                <div className="text-[11px] text-rose-400 mt-2 font-mono">
                  {depositError.message.slice(0, 100)}...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Access Control List (ACL) Delegated RSCs */}
        <div className="ws-panel min-w-0 p-4 sm:p-5 space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-tight">
                    RSC Permissions
                  </h3>
                  <span className="text-[11px] text-slate-400">Verified permissions for cross-chain execution</span>
                </div>
              </div>
            </div>

            {/* Delegation Row */}
            <div className="p-3.5 rounded-lg bg-[#050608] border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-2">
                    <span>StopLoss_Pipeline</span>
                    <span className={`text-[10px] font-mono px-2 py-0.2 rounded-full border ${
                      isRscAuthorized === true
                        ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
                        : 'text-slate-400 border-white/10 bg-white/[0.04]'
                    }`}>
                      {authorizationError ? 'READ FAILED' : isRscAuthorized === undefined ? '?' : isRscAuthorized ? 'AUTHORIZED' : 'NOT AUTHORIZED'}
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

              <button
                onClick={handleToggleAuthorizeRsc}
                disabled={isWritePending || isWriteConfirming || !canWrite || authorizationError || isRscAuthorized === undefined}
                className={`w-full py-2 px-3 text-xs font-semibold rounded-lg border transition-colors cursor-pointer disabled:opacity-50 ${
                  isRscAuthorized === true
                    ? 'bg-[#121318] hover:bg-rose-500/10 text-rose-100 hover:text-rose-200 border-white/10 hover:border-rose-500/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white border-transparent'
                }`}
              >
                {isRscAuthorized === true ? 'Revoke Contract Authorization' : 'Grant Contract Authorization'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Institutional Security & Danger Zone */}
      <div className="ws-panel border-rose-500/30 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-500/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-rose-200 tracking-tight">
                Emergency withdrawal
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
            Withdraw all Vault ETH to the owner wallet on Base Sepolia.
          </p>

          <div className="shrink-0">
            {!isPanicConfirmOpen ? (
              <button
                onClick={() => setIsPanicConfirmOpen(true)}
                disabled={isWritePending || isWriteConfirming || !canWrite}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                Emergency Withdraw All
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePanicWithdraw}
                  disabled={isWritePending || isWriteConfirming || !canWrite}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isWritePending || isWriteConfirming ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Confirming...</span>
                    </>
                  ) : (
                    <span>Confirm ETH withdrawal</span>
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
