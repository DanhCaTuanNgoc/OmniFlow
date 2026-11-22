'use client';

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { WorkspacePageHeader, WorkspaceState } from '@/components/common/WorkspaceUI';
import { useWorkspaceSignedIn, WorkspaceSignIn } from '@/components/common/WorkspaceSignIn';
import { getSavedVault, setSavedVault } from '@/lib/vaultSelection';
import { 
  Lock, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  ShieldAlert, 
  ShieldCheck, 
  Coins, 
  ArrowDownLeft, 
  Zap,
  ChevronDown,
  Check,
  Cpu
} from 'lucide-react';
import { useAccount, useBalance, useSendTransaction, useWriteContract, useWaitForTransactionReceipt, useReadContract, useSwitchChain } from 'wagmi';
import { parseEther, formatEther, isAddress, isAddressEqual, type Address } from 'viem';
import { CONTRACT_ADDRESSES } from '@/lib/constants';
import { truncateAddress } from '@/lib/utils';
import { ACTION_VAULT_ABI } from '@omniflow/shared';
import { workspaceRequest } from '@/lib/workspaceSession';
import type { DeploymentDetail, DeploymentSummary } from '@/lib/deployments';

export default function VaultManagerPage() {
  return (
    <Suspense fallback={<WorkspaceState title="Loading Vault Manager…" />}>
      <VaultRoute />
    </Suspense>
  );
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
    return (
      <div className="ws-page ws-page--sign-in">
        <WorkspacePageHeader title="Vault Manager" icon={<Lock className="size-4" />} />
        <WorkspaceSignIn />
      </div>
    );
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
    return (
      <VaultForWallet 
        userAddress={owner} 
        vaultAddress={deployment.contracts.vaultAddress} 
        rscAddress={deployment.contracts.rscAddress} 
      />
    );
  }

  return (
    <div className="ws-page space-y-5">
      <WorkspacePageHeader
        title="Vault Manager"
        description="Manage ActionVault collateral and permissions on Base Sepolia."
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
          <button 
            type="button" 
            className="ws-button self-start inline-flex items-center gap-1.5" 
            disabled={pending} 
            onClick={() => void open()}
          >
            <RefreshCw size={13} className={pending ? 'animate-spin' : ''} />
            <span>{pending ? 'Checking deployment…' : 'Open deployment Vault'}</span>
          </button>
          {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
          {deployment && (
            <WorkspaceState
              title="Deployment receipt pending."
              description="Awaiting on-chain confirmation on Lasna Testnet."
              icon={<Loader2 className="size-6 animate-spin text-[var(--ws-accent)]" />}
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedDeploymentName = showCustomRscInput
    ? 'Custom RSC Contract'
    : isAddressEqual(targetRsc, CONTRACT_ADDRESSES.DEFAULT_RSC_STOP_LOSS)
    ? 'Default StopLoss RSC'
    : deployments.find(({ contracts: { rscAddress } }) =>
        rscAddress && isAddressEqual(rscAddress, targetRsc)
      )?.name ?? 'Reactive RSC';

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

  // Read Vault Owner
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

  // Read Live On-Chain Vault Balance (Base Sepolia: 84532)
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

  // Read User Wallet Balance (Base Sepolia: 84532)
  const { 
    data: userBalance, 
    refetch: refetchUserBalance 
  } = useBalance({
    address: userAddress,
    chainId: 84532,
    query: { enabled: isOwner },
  });

  // Read Backup Safe Address from ActionVault contract
  const { data: backupSafeAddress } = useReadContract({
    address: vaultAddress,
    abi: ACTION_VAULT_ABI,
    functionName: 'backupSafeAddress',
    chainId: 84532,
    query: { enabled: isOwner },
  });

  // Read Authorized RSC Status for target RSC
  const { data: isRscAuthorized, isError: authorizationError, refetch: refetchAuthorization } = useReadContract({
    address: vaultAddress,
    abi: ACTION_VAULT_ABI,
    functionName: 'authorizedRSCs',
    args: [targetRsc],
    chainId: 84532,
    query: { enabled: isOwner && isAddress(targetRsc) },
  });

  // Deposit Transaction
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

  // Contract Write Actions (emergencyWithdraw & setAuthorizedRSC)
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
  }, [depositReceipt, depositTxHash, refetchVaultBalance, refetchUserBalance]);

  useEffect(() => {
    if (writeReceipt?.status === 'success' && writeTxHash) {
      refetchVaultBalance();
      refetchUserBalance();
      refetchAuthorization();
      setIsPanicConfirmOpen(false);
      setActionSuccessMsg({
        title: 'Transaction confirmed on Base Sepolia.',
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

  // Unverified or non-owner state
  if (!isOwner) {
    return (
      <div className="ws-page space-y-5">
        <WorkspacePageHeader
          title="Vault Manager"
          description="Manage collateral and Reactive contract permissions on Base Sepolia."
          icon={<Lock className="size-4" />}
        />

        {isConnected && !isCorrectChain && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="size-4 text-amber-400 shrink-0" />
              <span>
                Your wallet is on Chain ID {chainId}. Switch to Base Sepolia (84532) to manage your ActionVault.
              </span>
            </div>
            <button
              type="button"
              onClick={() => switchChain?.({ chainId: 84532 })}
              disabled={isSwitchingChain}
              className="ws-button ws-button-primary text-xs shrink-0"
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
              Connected wallet ({userAddress ? truncateAddress(userAddress) : ''}) is not the owner of vault ({truncateAddress(vaultAddress)}).
            </span>
            <button
              type="button"
              onClick={onUnlinkVault}
              className="ws-button text-xs text-rose-300 border-rose-500/30 shrink-0"
            >
              Reset to Default Vault
            </button>
          </div>
        )}

        <WorkspaceState
          title={
            !isConnected
              ? 'Connect wallet to inspect Vault assets.'
              : !vaultConfigured
              ? 'The configured Vault address is invalid.'
              : ownerError
              ? 'Unable to verify Vault ownership.'
              : ownerPending
              ? 'Checking Vault ownership...'
              : 'No verified ActionVault linked to this wallet.'
          }
          description={
            ownerError 
              ? 'Check the contract address and Base Sepolia network connection.' 
              : 'Connect the owner wallet to deposit collateral and authorize RSC executions.'
          }
          icon={<Lock className="size-6" />}
          action={!isConnected ? undefined : { label: 'Go to Pipeline Studio', href: '/workspace/studio' }}
        />

        {/* Link existing ActionVault */}
        {isConnected && onLinkVault && (
          <div className="mx-auto w-full max-w-lg rounded-xl border border-[var(--ws-border)] bg-[var(--ws-panel)] p-5 space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white">Link ActionVault Contract</h3>
              <p className="text-xs text-[var(--ws-muted)] leading-relaxed">
                Enter your deployed ActionVault contract address on Base Sepolia (84532) to manage balances and configure permissions.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-300 font-medium block mb-1">
                  Contract Address
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
                    setLinkError('Enter a valid Ethereum contract address (0x...).');
                    return;
                  }
                  onLinkVault(inputVault as Address);
                }}
                className="ws-button ws-button-primary text-xs w-full justify-center"
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
        description={`Base Sepolia (84532) · ${truncateAddress(vaultAddress, 8)}`}
        icon={<Lock className="size-4" />}
        actions={
          <div className="flex items-center gap-2">
            {isCustomVaultLinked && onUnlinkVault && (
              <button
                type="button"
                className="ws-button text-xs text-rose-300 hover:text-rose-200 border-rose-500/30"
                onClick={onUnlinkVault}
                title="Unlink custom ActionVault"
              >
                Unlink Vault
              </button>
            )}
            <button
              type="button"
              className="ws-button inline-flex items-center gap-1.5 text-xs"
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
              className="ws-button inline-flex items-center gap-1.5 text-xs"
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

      {/* Network Warning Banner */}
      {!isConnected ? (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="size-4 text-amber-400 shrink-0" />
            <span>Connect wallet to deposit collateral or execute withdrawals.</span>
          </div>
          <span className="text-[11px] text-amber-400 font-medium">Disconnected</span>
        </div>
      ) : !isCorrectChain ? (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="size-4 text-amber-400 shrink-0" />
            <span>
              Switch wallet to Base Sepolia (84532) to interact with ActionVault. (Current: {chainId ?? 'Unknown'})
            </span>
          </div>
          <button
            type="button"
            onClick={() => switchChain?.({ chainId: 84532 })}
            disabled={isSwitchingChain}
            className="ws-button ws-button-primary text-xs shrink-0"
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
      ) : null}

      {/* Action Success Notification */}
      {actionSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
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

      {vaultBalanceError && <p role="status" className="text-xs text-amber-300">Unable to load Vault balance.</p>}

      {/* Main Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Collateral Management */}
        <div className="rounded-xl border border-[var(--ws-border)] bg-[var(--ws-panel)] p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--ws-border)]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-zinc-300 shrink-0">
                  <Coins className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-tight">
                    Collateral Balance
                  </h3>
                  <span className="text-[11px] text-[var(--ws-muted)]">Available for automated DEX execution</span>
                </div>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono">
                Base Sepolia
              </span>
            </div>

            {/* Asset Row */}
            <div className="p-3 rounded-lg bg-[#111318] border border-[var(--ws-border)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-7 rounded-full bg-white/10 flex items-center justify-center text-white font-mono text-xs font-semibold">
                  ETH
                </div>
                <div>
                  <div className="text-xs font-medium text-white">Native Ethereum</div>
                  <div className="text-[11px] text-[var(--ws-muted)]">Vault collateral</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-white font-mono tabular-nums">
                  {formattedVaultEth !== undefined ? `${formattedVaultEth} ETH` : '0.00 ETH'}
                </div>
              </div>
            </div>

            {/* Deposit Controls */}
            <div className="space-y-2.5 pt-1">
              <div className="flex justify-between items-center text-xs">
                <label className="text-zinc-300 font-medium">Deposit Amount (ETH)</label>
                {userBalance && (
                  <span className="text-[var(--ws-muted)] text-[11px]">
                    Wallet: <span className="font-mono tabular-nums text-zinc-200">{parseFloat(formatEther(userBalance.value)).toFixed(4)} ETH</span>
                  </span>
                )}
              </div>

              {/* Quick Select Presets */}
              <div className="grid grid-cols-4 gap-1.5">
                {['0.001', '0.005', '0.01', '0.05'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(amt)}
                    className={`py-1 text-xs rounded-md border transition-colors ${
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
                  className="ws-button ws-button-primary text-xs font-semibold shrink-0 disabled:opacity-50"
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
        </div>

        {/* Right: Delegated RSC Permissions */}
        <div className="rounded-xl border border-[var(--ws-border)] bg-[var(--ws-panel)] p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--ws-border)]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-zinc-300 shrink-0">
                  <ShieldCheck className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-tight">
                    RSC Permissions
                  </h3>
                  <span className="text-[11px] text-[var(--ws-muted)]">Callback authorization for Reactive Smart Contracts</span>
                </div>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono">
                Access Control
              </span>
            </div>

            {/* Custom Styled Pipeline Automation Contract Selector */}
            <div className="space-y-1.5" ref={dropdownRef}>
              <div className="flex items-center justify-between text-xs">
                <label className="text-zinc-300 font-medium">
                  Pipeline Automation Contract
                </label>
                <span className="text-[11px] text-zinc-500 font-mono">Lasna #5318007</span>
              </div>

              {/* Custom Trigger Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between gap-2.5 rounded-lg border border-[var(--ws-border)] bg-[#111318] p-2.5 text-left text-xs transition-colors hover:border-zinc-500/60 focus:border-[var(--ws-accent)] focus:outline-none"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-md bg-white/[0.05] border border-white/5 text-[var(--ws-accent)] shrink-0">
                      <Cpu className="size-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-white truncate text-xs">
                        {selectedDeploymentName}
                      </div>
                      <div className="text-[11px] font-mono text-[var(--ws-muted)] truncate">
                        {truncateAddress(targetRsc, 8)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium border flex items-center gap-1 ${
                        isRscAuthorized === true
                          ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'
                          : 'text-zinc-400 border-white/10 bg-white/5'
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          isRscAuthorized === true ? 'bg-emerald-400' : 'bg-zinc-500'
                        }`}
                      />
                      <span>
                        {authorizationError
                          ? 'Read Failed'
                          : isRscAuthorized === undefined
                          ? 'Checking'
                          : isRscAuthorized
                          ? 'Authorized'
                          : 'Unauthorized'}
                      </span>
                    </span>
                    <ChevronDown className={`size-3.5 text-zinc-400 transition-transform duration-150 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Floating Custom Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 z-30 rounded-xl border border-[var(--ws-border)] bg-[#141720] shadow-2xl p-1.5 space-y-1 text-xs animate-in fade-in zoom-in-95 duration-100">
                    {deployments.length > 0 && (
                      <div className="space-y-0.5">
                        <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                          Deployed Pipelines
                        </div>
                        {deployments.map(({ pipelineId, name, contracts: { rscAddress } }) =>
                          rscAddress ? (
                            <button
                              key={pipelineId}
                              type="button"
                              onClick={() => {
                                setTargetRsc(rscAddress);
                                setShowCustomRscInput(false);
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                                isAddressEqual(targetRsc, rscAddress) && !showCustomRscInput
                                  ? 'bg-[var(--ws-accent-bg)] text-white'
                                  : 'hover:bg-white/5 text-zinc-300 hover:text-white'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="font-medium truncate">{name}</div>
                                <div className="text-[11px] font-mono text-zinc-400">{truncateAddress(rscAddress, 8)}</div>
                              </div>
                              {isAddressEqual(targetRsc, rscAddress) && !showCustomRscInput && (
                                <Check className="size-3.5 text-[var(--ws-accent)] shrink-0" />
                              )}
                            </button>
                          ) : null
                        )}
                      </div>
                    )}

                    <div className="space-y-0.5 border-t border-white/[0.06] pt-1">
                      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                        Default Blueprints
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setTargetRsc(CONTRACT_ADDRESSES.DEFAULT_RSC_STOP_LOSS);
                          setShowCustomRscInput(false);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                          isAddressEqual(targetRsc, CONTRACT_ADDRESSES.DEFAULT_RSC_STOP_LOSS) && !showCustomRscInput
                            ? 'bg-[var(--ws-accent-bg)] text-white'
                            : 'hover:bg-white/5 text-zinc-300 hover:text-white'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-medium truncate">Default StopLoss RSC</div>
                          <div className="text-[11px] font-mono text-zinc-400">
                            {truncateAddress(CONTRACT_ADDRESSES.DEFAULT_RSC_STOP_LOSS, 8)}
                          </div>
                        </div>
                        {isAddressEqual(targetRsc, CONTRACT_ADDRESSES.DEFAULT_RSC_STOP_LOSS) && !showCustomRscInput && (
                          <Check className="size-3.5 text-[var(--ws-accent)] shrink-0" />
                        )}
                      </button>
                    </div>

                    <div className="border-t border-white/[0.06] pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomRscInput(true);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                          showCustomRscInput
                            ? 'bg-[var(--ws-accent-bg)] text-white'
                            : 'hover:bg-white/5 text-zinc-300 hover:text-white'
                        }`}
                      >
                        <div className="font-medium">Enter Custom RSC Address...</div>
                        {showCustomRscInput && <Check className="size-3.5 text-[var(--ws-accent)] shrink-0" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Address Input */}
              {showCustomRscInput && (
                <div className="flex gap-2 pt-1 animate-in fade-in duration-150">
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
                    className="ws-button text-xs disabled:opacity-50 shrink-0"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>

            {/* Permission Action Card */}
            <div className="p-3.5 rounded-lg bg-[#111318] border border-[var(--ws-border)] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--ws-muted)]">Explorer Verification</span>
                <a
                  href={`https://lasna.reactscan.net/address/${targetRsc}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[var(--ws-accent)] hover:underline font-mono text-[11px]"
                >
                  <span>ReactScan</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>

              <button
                type="button"
                onClick={handleToggleAuthorizeRsc}
                disabled={isWritePending || isWriteConfirming || !canWrite || authorizationError || isRscAuthorized === undefined}
                className={`w-full py-2 px-3 text-xs font-semibold rounded-md border transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 ${
                  isRscAuthorized === true
                    ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : 'ws-button ws-button-primary'
                }`}
              >
                {isWritePending || isWriteConfirming ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Confirming on Base Sepolia...</span>
                  </>
                ) : isRscAuthorized === true ? (
                  'Revoke Permission'
                ) : (
                  'Grant Permission'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Withdrawal Panel */}
      <div className="rounded-xl border border-[var(--ws-border)] bg-[var(--ws-panel)] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--ws-border)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
              <ShieldAlert className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Emergency Withdrawal
              </h3>
              <p className="text-[11px] text-[var(--ws-muted)]">
                Direct on-chain recovery independent of Reactive network or relayer state
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            Owner Only
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
            Withdraws all native ETH from ActionVault directly back to your owner wallet on Base Sepolia. 
            Existing contract authorizations remain intact for future deposits.
            {backupSafeAddress && (
              <span className="block mt-1 text-[11px] font-mono text-zinc-500">
                Backup Safe: {backupSafeAddress}
              </span>
            )}
          </p>

          <div className="shrink-0">
            {!isPanicConfirmOpen ? (
              <button
                type="button"
                onClick={() => setIsPanicConfirmOpen(true)}
                disabled={isWritePending || isWriteConfirming || !canWrite}
                className="ws-button text-xs text-rose-300 hover:text-white hover:bg-rose-600/30 border-rose-500/30 transition-colors disabled:opacity-50"
              >
                Emergency Withdraw All
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePanicWithdraw}
                  disabled={isWritePending || isWriteConfirming || !canWrite}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-md bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isWritePending || isWriteConfirming ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Confirming...</span>
                    </>
                  ) : (
                    <span>Confirm Withdraw</span>
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
