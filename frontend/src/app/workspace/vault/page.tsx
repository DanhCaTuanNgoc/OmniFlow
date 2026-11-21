'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { WorkspacePageHeader, WorkspaceState } from '@/components/common/WorkspaceUI';
import { useWorkspaceSignedIn, WorkspaceSignIn } from '@/components/common/WorkspaceSignIn';
import { getSavedVault, setSavedVault } from '@/lib/vaultSelection';
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
  Coins,
  Zap
} from 'lucide-react';
import { useAccount, useBalance, useSendTransaction, useWriteContract, useWaitForTransactionReceipt, useReadContract, useSwitchChain } from 'wagmi';
import { parseEther, formatEther, isAddress, isAddressEqual, type Address } from 'viem';
import { CONTRACT_ADDRESSES } from '@/lib/constants';
import { truncateAddress } from '@/lib/utils';
import { ACTION_VAULT_ABI } from '@omniflow/shared';
import { workspaceRequest } from '@/lib/workspaceSession';
import type { DeploymentDetail, DeploymentSummary } from '@/lib/deployments';

export default function VaultManagerPage() {
  return <Suspense fallback={<WorkspaceState title="Loading Vault Manager…" />}><VaultRoute /></Suspense>;
}

function VaultRoute() {
  const { address, isConnected } = useAccount();
  const id = useSearchParams().get('deployment');
  const owner = isConnected ? address : undefined;
  const signedIn = useWorkspaceSignedIn(owner);
  const [customVault, setCustomVault] = useState<Address | null>(null);

  useEffect(() => {
    setCustomVault(owner ? getSavedVault(owner) : null);
  }, [owner]);

  const handleLink = (addr: Address) => {
    setCustomVault(addr);
  };

  const handleConfirmVerifiedLink = (addr: Address) => {
    if (owner) setSavedVault(owner, addr);
  };

  const handleUnlink = () => {
    if (owner) setSavedVault(owner, null);
    setCustomVault(null);
  };

  if (!signedIn) {
    return <div className="ws-page ws-page--sign-in">
      <WorkspacePageHeader title="Vault Manager" icon={<Lock className="size-4" />} />
      <WorkspaceSignIn />
    </div>;
  }

  return id ? (
    <VaultSelection key={`${owner}:${id}`} owner={owner} id={id} />
  ) : (
    <VaultForWallet
      key={`${owner ?? 'guest'}:${customVault ?? 'default'}`}
      userAddress={owner}
      vaultAddress={customVault ?? CONTRACT_ADDRESSES.DEFAULT_ACTION_VAULT}
      isCustomVaultLinked={Boolean(customVault)}
      onLinkVault={handleLink}
      onConfirmVerifiedLink={handleConfirmVerifiedLink}
      onUnlinkVault={handleUnlink}
    />
  );
}

function VaultSelection({ owner, id }: { owner?: Address; id: string }) {
  const [deployment, setDeployment] = useState<DeploymentDetail>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  async function open() {
    if (!owner) return;
    setPending(true);
    setError(undefined);
    try {
      setDeployment(await workspaceRequest<DeploymentDetail>(owner, `/pipeline/deployments/${encodeURIComponent(id)}`, { sessionOnly: true }));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to load the Vault.');
    } finally {
      setPending(false);
    }
  }
  if (deployment?.contracts.rscAddress) {
    return <VaultForWallet userAddress={owner} vaultAddress={deployment.contracts.vaultAddress} rscAddress={deployment.contracts.rscAddress} />;
  }
  return (
    <div className="ws-page space-y-5">
      <WorkspacePageHeader
        title="Vault Manager"
        description="Open the Base Sepolia Vault for this deployment."
        icon={<Lock className="size-4" />}
      />
      {!owner ? (
        <WorkspaceState
          title="Connect the deployment wallet."
          description="Connect your wallet to inspect permissions and balances."
          icon={<Lock className="size-6" />}
          action={{ label: 'Open Pipeline Studio', href: '/workspace/studio' }}
        />
      ) : (
        <>
          <button type="button" className="ws-button self-start inline-flex items-center gap-1.5" disabled={pending} onClick={() => void open()}>
            <RefreshCw size={13} className={pending ? 'animate-spin' : ''} />
            <span>{pending ? 'Checking deployment…' : 'Open deployment Vault'}</span>
          </button>
          {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
          {deployment && (
            <WorkspaceState
              title="The Lasna deployment receipt is pending."
              description="Awaiting on-chain confirmation on Lasna Testnet."
              icon={<Loader2 className="size-6 animate-spin text-sky-400" />}
            />
          )}
        </>
      )}
    </div>
  );
}

function VaultForWallet({ 
  userAddress, 
  vaultAddress, 
  rscAddress: initialRscAddress,
  isCustomVaultLinked,
  onLinkVault,
  onConfirmVerifiedLink,
  onUnlinkVault,
}: { 
  userAddress?: Address; 
  vaultAddress: Address; 
  rscAddress?: Address;
  isCustomVaultLinked?: boolean;
  onLinkVault?: (address: Address) => void;
  onConfirmVerifiedLink?: (address: Address) => void;
  onUnlinkVault?: () => void;
}) {
  const { chainId } = useAccount();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const isConnected = Boolean(userAddress);
  const [depositAmount, setDepositAmount] = useState('0.001');
  const [isPanicConfirmOpen, setIsPanicConfirmOpen] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<{ title: string; txHash?: string } | null>(null);

  // Link existing Vault input
  const [inputVault, setInputVault] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);

  // Target RSC to view & authorize
  const [deployments, setDeployments] = useState<DeploymentSummary[]>([]);
  const [targetRsc, setTargetRsc] = useState<Address>(
    initialRscAddress ?? CONTRACT_ADDRESSES.DEFAULT_RSC_STOP_LOSS
  );
  const [customRscInput, setCustomRscInput] = useState('');
  const [showCustomRscInput, setShowCustomRscInput] = useState(false);

  useEffect(() => {
    if (!userAddress) return;
    void workspaceRequest<{ deployments: DeploymentSummary[] }>(userAddress, '/pipeline/deployments', { sessionOnly: true }).then(({ deployments: deps }) => {
      setDeployments(deps);
      const deployedRsc = deps.find(({ contracts }) => contracts.rscAddress)?.contracts.rscAddress;
      if (!initialRscAddress && deployedRsc) {
        setTargetRsc(deployedRsc);
      }
    }).catch(() => {});
  }, [userAddress, initialRscAddress]);

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

  // Confirm and persist custom vault link ONLY when RPC confirms ownership
  useEffect(() => {
    if (isOwner && isCustomVaultLinked && vaultAddress) {
      onConfirmVerifiedLink?.(vaultAddress);
    }
  }, [isOwner, isCustomVaultLinked, vaultAddress, onConfirmVerifiedLink]);

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

  // 5. Read Authorized RSC Status for target RSC
  const { data: isRscAuthorized, isError: authorizationError, refetch: refetchAuthorization } = useReadContract({
    address: vaultAddress,
    abi: ACTION_VAULT_ABI,
    functionName: 'authorizedRSCs',
    args: [targetRsc],
    chainId: 84532,
    query: { enabled: isOwner && isAddress(targetRsc) },
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
    if (!canWrite || !userAddress || isRscAuthorized === undefined || authorizationError || !isAddress(targetRsc)) return;
    const nextStatus = !isRscAuthorized;
    writeContract({
      address: vaultAddress,
      account: userAddress,
      abi: ACTION_VAULT_ABI,
      functionName: 'setAuthorizedRSC',
      args: [targetRsc, nextStatus],
      chainId: 84532,
    });
  };

  const formattedVaultEth = vaultBalance && !vaultBalanceError ? formatEther(vaultBalance.value) : undefined;

  if (!isOwner) {
    return (
      <div className="ws-page space-y-5">
        <WorkspacePageHeader
          title="Vault Manager"
          description="Manage collateral and Reactive contract permissions on Base Sepolia."
          icon={<Lock className="size-4" />}
        />
        {isConnected && !isCorrectChain && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="size-4 text-rose-400 shrink-0" />
              <span>
                Your wallet is currently on Chain ID {chainId}. Please switch to Base Sepolia (84532) to interact with ActionVault.
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
        )}
        {isCustomVaultLinked && onUnlinkVault && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span>
              Your connected wallet ({userAddress ? truncateAddress(userAddress) : ''}) is not the owner of this custom ActionVault ({truncateAddress(vaultAddress)}).
            </span>
            <button
              type="button"
              onClick={onUnlinkVault}
              className="ws-button text-xs text-rose-300 border-rose-500/30 shrink-0 self-start sm:self-auto"
            >
              Reset to Default Vault
            </button>
          </div>
        )}
        <WorkspaceState
          title={
            !isConnected
              ? 'Connect your wallet to inspect Vault assets.'
              : !vaultConfigured
              ? 'The configured Vault address is invalid.'
              : ownerError
              ? 'Unable to verify Vault ownership.'
              : ownerPending
              ? 'Checking Vault ownership...'
              : 'No verified ActionVault is linked to this wallet.'
          }
          description={ownerError ? 'Check the configured contract address and Base Sepolia RPC connection.' : 'Connect MetaMask with the owner address to deposit collateral and authorize RSC execution.'}
          icon={<Lock className="size-6" />}
          action={!isConnected ? undefined : { label: 'Go to Pipeline Studio', href: '/workspace/studio' }}
        />

        {/* Section 1 & 6.2: Link existing ActionVault */}
        {isConnected && onLinkVault && (
          <div className="mx-auto w-full max-w-lg rounded-xl border border-[var(--ws-border)] bg-[var(--ws-panel)] p-5 space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white">Link Your ActionVault Contract</h3>
              <p className="text-xs text-[var(--ws-muted)] leading-relaxed">
                Enter the contract address of your ActionVault deployed on Base Sepolia (Chain ID: 84532) to manage collateral, panic withdraw, and configure authorized RSCs.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-300 font-medium block mb-1">
                  ActionVault Address
                </label>
                <input
                  type="text"
                  value={inputVault}
                  onChange={(e) => {
                    setInputVault(e.target.value.trim());
                    setLinkError(null);
                  }}
                  placeholder="0x..."
                  className="w-full rounded-md border border-[var(--ws-border)] bg-[#111318] px-3 py-2 text-xs text-white font-mono placeholder-zinc-600 focus:border-[var(--ws-accent)] focus:outline-none"
                />
              </div>

              {linkError && (
                <p role="alert" className="text-xs text-rose-300">{linkError}</p>
              )}

              <button
                type="button"
                onClick={() => {
                  if (!isAddress(inputVault)) {
                    setLinkError('Please enter a valid Ethereum hex address (0x...).');
                    return;
                  }
                  onLinkVault(inputVault as Address);
                }}
                className="ws-button ws-button-primary inline-flex items-center gap-1.5 text-xs w-full justify-center"
              >
                <span>Link & Verify Vault</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="ws-page space-y-5">
      <WorkspacePageHeader
        title="Vault Manager"
        description={`Base Sepolia (Chain ID: 84532) / ${truncateAddress(vaultAddress, 8)}`}
        icon={<Lock className="size-4" />}
        actions={
          <div className="flex items-center gap-2">
            {isCustomVaultLinked && onUnlinkVault && (
              <button
                type="button"
                className="ws-button text-xs text-rose-300 hover:text-rose-200 border-rose-500/30"
                onClick={onUnlinkVault}
                title="Unlink custom ActionVault and reset to default"
              >
                Unlink Vault
              </button>
            )}
            <button
              type="button"
              className="ws-button inline-flex items-center gap-1.5"
              onClick={() => {
                refetchVaultBalance();
                refetchUserBalance();
                refetchAuthorization();
              }}
            >
              <RefreshCw size={13} className={isVaultBalanceLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <a
              className="ws-button inline-flex items-center gap-1.5"
              href={`https://sepolia.basescan.org/address/${vaultAddress}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Basescan</span>
              <ExternalLink size={12} />
            </a>
          </div>
        }
      />

      {/* Network Warning Banner if disconnected or wrong chain */}
      {!isConnected ? (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="size-4 text-amber-400 shrink-0" />
            <span>Connect your MetaMask wallet to execute live on-chain deposits and non-custodial emergency withdrawals.</span>
          </div>
          <span className="font-mono text-[10px] text-amber-400 font-semibold uppercase">Wallet Disconnected</span>
        </div>
      ) : !isCorrectChain ? (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="size-4 text-rose-400 shrink-0" />
            <span>
              Please switch your wallet to Base Sepolia (Chain ID: 84532) to interact with ActionVault. (Current: {chainId ?? 'Unknown'})
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-[10px] text-rose-400 font-semibold uppercase">
              Wrong Network
            </span>
            <button
              type="button"
              onClick={() => switchChain?.({ chainId: 84532 })}
              disabled={isSwitchingChain}
              className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs px-3 py-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
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
        </div>
      ) : null}

      {/* Action Success Toast Banner */}
      {actionSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
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
              <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      )}

      {vaultBalanceError && <p role="status" className="text-xs text-amber-300">Unable to read the Vault balance.</p>}
      {backupSafeAddress && <p className="text-xs text-zinc-400 font-mono">Backup safe address: {backupSafeAddress}</p>}

      {/* Main Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Collateral Management */}
        <div className="rounded-xl border border-[var(--ws-border)] bg-[var(--ws-panel)] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--ws-border)]">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Coins className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  Collateral Reserves
                </h3>
                <span className="text-[11px] text-[var(--ws-muted)]">Automated execution balance on Base Sepolia</span>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-300 border border-white/10">
              #84532 Denim
            </span>
          </div>

          {/* Asset Display */}
          <div className="p-3.5 rounded-lg bg-[#111318] border border-[var(--ws-border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white font-mono font-bold text-xs">
                ETH
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Native Ethereum</div>
                <div className="text-[10px] text-[var(--ws-muted)] font-mono">Execution asset for DEX stop-loss</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-white font-mono tabular-nums">
                {formattedVaultEth !== undefined ? `${formattedVaultEth} ETH` : '0.00 ETH'}
              </div>
            </div>
          </div>

          {/* Deposit Input */}
          <div className="space-y-2.5 pt-1">
            <div className="flex justify-between items-center text-xs">
              <label className="text-zinc-300 font-medium">Deposit Collateral (ETH)</label>
              {userBalance && (
                <span className="text-[var(--ws-muted)] font-mono text-[11px] tabular-nums">
                  Wallet: {parseFloat(formatEther(userBalance.value)).toFixed(4)} ETH
                </span>
              )}
            </div>

            {/* Quick Select Buttons */}
            <div className="grid grid-cols-4 gap-1.5">
              {['0.001', '0.005', '0.01', '0.05'].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setDepositAmount(amt)}
                  className={`py-1 rounded border text-[11px] font-mono transition-colors ${
                    depositAmount === amt
                      ? 'border-[var(--ws-accent)] bg-[var(--ws-accent-bg)] text-[var(--ws-accent)] font-semibold'
                      : 'border-[var(--ws-border)] bg-[#111318] text-zinc-300 hover:bg-white/5'
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
                className="min-w-0 flex-1 bg-[#111318] border border-[var(--ws-border)] rounded-md px-3 py-1.5 text-xs text-white font-mono focus:border-[var(--ws-accent)] focus:outline-none tabular-nums"
                placeholder="0.001"
              />
              <button
                type="button"
                onClick={handleDeposit}
                disabled={isDepositPending || isDepositConfirming || !canWrite}
                className="ws-button ws-button-primary inline-flex items-center gap-1.5 text-xs font-semibold shrink-0 disabled:opacity-50"
              >
                {isDepositPending || isDepositConfirming ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Depositing...</span>
                  </>
                ) : (
                  <>
                    <ArrowDownLeft className="size-3.5" />
                    <span>Deposit</span>
                  </>
                )}
              </button>
            </div>

            {depositReceipt?.status === 'reverted' && <p role="alert" className="text-xs text-rose-300">Vault deposit reverted.</p>}
            {depositError && (
              <div className="text-[11px] text-rose-400 mt-1 font-mono">
                {depositError.message.slice(0, 100)}...
              </div>
            )}
          </div>
        </div>

        {/* Right: Access Control List (ACL) Delegated RSCs */}
        <div className="rounded-xl border border-[var(--ws-border)] bg-[var(--ws-panel)] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--ws-border)]">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  RSC Permissions
                </h3>
                <span className="text-[11px] text-[var(--ws-muted)]">Verified execution rights for Reactive Smart Contracts</span>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-300 border border-white/10">
              ACL Guard
            </span>
          </div>

          {/* Target RSC Selector / Input */}
          <div className="space-y-2">
            {deployments.length > 0 && (
              <div className="space-y-1">
                <label className="text-[11px] text-zinc-300 font-medium block">
                  Select Pipeline Automation RSC
                </label>
                <select
                  value={showCustomRscInput ? 'custom' : targetRsc}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setShowCustomRscInput(true);
                    } else {
                      setShowCustomRscInput(false);
                      setTargetRsc(e.target.value as Address);
                    }
                  }}
                  className="w-full rounded-md border border-[var(--ws-border)] bg-[#111318] px-2.5 py-1.5 text-xs text-white focus:border-[var(--ws-accent)] focus:outline-none"
                >
                  {deployments.map(({ pipelineId, name, contracts: { rscAddress } }) =>
                    rscAddress && (
                      <option key={pipelineId} value={rscAddress}>
                        {name} ({truncateAddress(rscAddress, 6)})
                      </option>
                    )
                  )}
                  <option value={CONTRACT_ADDRESSES.DEFAULT_RSC_STOP_LOSS}>
                    Default StopLoss RSC ({truncateAddress(CONTRACT_ADDRESSES.DEFAULT_RSC_STOP_LOSS, 6)})
                  </option>
                  <option value="custom">-- Custom RSC Address --</option>
                </select>
              </div>
            )}

            {showCustomRscInput && (
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="0x... (Reactive Lasna RSC Address)"
                  value={customRscInput}
                  onChange={(e) => setCustomRscInput(e.target.value.trim())}
                  className="min-w-0 flex-1 bg-[#111318] border border-[var(--ws-border)] rounded-md px-3 py-1.5 text-xs text-white font-mono focus:border-[var(--ws-accent)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (isAddress(customRscInput)) {
                      setTargetRsc(customRscInput as Address);
                    }
                  }}
                  disabled={!isAddress(customRscInput)}
                  className="ws-button text-xs disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Delegation Row */}
          <div className="p-3.5 rounded-lg bg-[#111318] border border-[var(--ws-border)] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-2">
                  <span>
                    {deployments.find(({ contracts: { rscAddress } }) =>
                      rscAddress && isAddressEqual(rscAddress, targetRsc)
                    )?.name ?? 'Reactive RSC'}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.2 rounded-full border ${
                    isRscAuthorized === true
                      ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                      : 'text-zinc-400 border-white/10 bg-white/5'
                  }`}>
                    {authorizationError ? 'READ FAILED' : isRscAuthorized === undefined ? '?' : isRscAuthorized ? 'AUTHORIZED' : 'NOT AUTHORIZED'}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-[var(--ws-muted)] mt-0.5">
                  RSC: {truncateAddress(targetRsc, 8)} (Lasna #5318007)
                </div>
              </div>

              <a
                href={`https://lasna.reactscan.net/address/${targetRsc}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
                title="View on ReactScan"
              >
                <ExternalLink className="size-3.5" />
              </a>
            </div>

            <button
              type="button"
              onClick={handleToggleAuthorizeRsc}
              disabled={isWritePending || isWriteConfirming || !canWrite || authorizationError || isRscAuthorized === undefined}
              className={`w-full py-1.5 px-3 text-xs font-semibold rounded-md border transition-colors cursor-pointer disabled:opacity-50 ${
                isRscAuthorized === true
                  ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                  : 'ws-button ws-button-primary'
              }`}
            >
              {isRscAuthorized === true ? 'Revoke Contract Authorization' : 'Grant Contract Authorization'}
            </button>
          </div>
        </div>
      </div>

      {/* Institutional Security & Danger Zone (Panic Button) */}
      <div className="rounded-xl border border-rose-500/30 bg-rose-950/10 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-500/20">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-rose-200 tracking-tight">
                Emergency Non-Custodial Sweep (Panic Button)
              </h3>
              <p className="text-[11px] text-rose-300/70">
                Direct on-chain execution &bull; Completely independent of Reactive network or relayer state
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
            OWNER PRIVILEGE
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <p className="text-xs text-rose-200/80 leading-relaxed max-w-2xl">
            Withdraw all native ETH from this Vault to its owner on Base Sepolia. Wait for the transaction receipt.
            Existing RSC permissions stay in effect for future deposits.
          </p>

          <div className="shrink-0">
            {!isPanicConfirmOpen ? (
              <button
                type="button"
                onClick={() => setIsPanicConfirmOpen(true)}
                disabled={isWritePending || isWriteConfirming || !canWrite}
                className="px-4 py-2 text-xs font-semibold rounded-md bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                Emergency Withdraw All
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePanicWithdraw}
                  disabled={isWritePending || isWriteConfirming || !canWrite}
                  className="px-4 py-2 text-xs font-semibold rounded-md bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isWritePending || isWriteConfirming ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Confirming...</span>
                    </>
                  ) : (
                    <span>Confirm ETH withdrawal</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsPanicConfirmOpen(false)}
                  className="ws-button text-xs"
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
