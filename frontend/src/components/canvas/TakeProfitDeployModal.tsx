'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BaseError, formatEther, isAddressEqual, parseEther, type Address, type EIP1193Provider, type Hash, type Hex } from 'viem';
import { getAccount, sendTransaction, switchChain, waitForTransactionReceipt } from 'wagmi/actions';
import { resolvePhaseTwo, type StopLossGraph } from '@omniflow/shared';
import { 
  AlertCircle,
  ArrowRight,
  CheckCircle2, 
  Circle,
  Coins, 
  ExternalLink, 
  KeyRound, 
  Loader2, 
  RotateCcw, 
  Rocket, 
  ShieldCheck 
} from 'lucide-react';
import { DeployDialog, DeploySummary } from './DeployConfirmation';
import { runDeploymentAction, type DeploymentDetail, type DeploymentSummary } from '@/lib/deployments';
import { wagmiConfig } from '@/lib/wagmi';
import { WorkspaceWalletPromptCancelled, workspaceRequest } from '@/lib/workspaceSession';
import { truncateAddress } from '@/lib/utils';

type Quote = { data: Hex; gas: string; gasPrice: string; value: string };
type DeployResponse = { transaction?: Quote; deployment?: DeploymentSummary };

class WalletPermissionRequired extends Error {}

function hasWalletError(error: unknown, code: number) {
  const matches = (cause: unknown) => typeof cause === 'object' && cause !== null && 'code' in cause && cause.code === code;
  return matches(error instanceof BaseError ? error.walk(matches) : error);
}

async function lasnaWallet(owner: Address) {
  const account = getAccount(wagmiConfig);
  if (!account.address || !isAddressEqual(account.address, owner) || account.chainId !== 5318007 || !account.connector) {
    throw new Error('Connect the Vault owner on Reactive Lasna (5318007).');
  }
  const provider = await account.connector.getProvider() as EIP1193Provider | undefined;
  if (!provider) throw new Error('Open the connected wallet and unlock it.');
  return provider;
}

export function TakeProfitDeployModal({ owner, graph, draft, onClose }: {
  owner: Address;
  graph: StopLossGraph & { metadata: { name: string; ownerAddress: Address; description?: string } };
  draft: { id: string; updatedAt: number };
  onClose: () => void;
}) {
  const [stage, setStage] = useState<'lasna' | 'vault-setup'>('lasna');
  const [quote, setQuote] = useState<Quote>();
  const [deployment, setDeployment] = useState<DeploymentSummary>();
  const [detail, setDetail] = useState<DeploymentDetail>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [needsPermission, setNeedsPermission] = useState(false);
  const [principalAmount, setPrincipalAmount] = useState('0.05');
  const [callbackAmount, setCallbackAmount] = useState('0.02');

  const locked = useRef(false);
  const storageKey = `omniflow.take-profit.v1.${owner.toLowerCase()}.${draft.id}.${draft.updatedAt}`;

  // Helper to load live deployment details from backend
  async function loadDetail(pipelineId: string) {
    try {
      const res = await workspaceRequest<DeploymentDetail>(owner, `/pipeline/deployments/${encodeURIComponent(pipelineId)}`, {
        sessionOnly: true,
      });
      setDetail(res);
      setDeployment(res);
    } catch {
      // Non-blocking detail fetch
    }
  }

  // 1. Auto-quote on Mount
  useEffect(() => {
    let active = true;

    async function initQuote() {
      setBusy(true);
      setError(undefined);
      try {
        const saved = localStorage.getItem(storageKey);
        const attempt = saved ? (JSON.parse(saved) as { key: string; hash?: Hash }) : { key: crypto.randomUUID() };
        localStorage.setItem(storageKey, JSON.stringify(attempt));

        async function request(hash?: Hash) {
          return workspaceRequest<DeployResponse>(owner, '/pipeline/take-profit/deploy', {
            method: 'POST',
            body: JSON.stringify({ graph, draftId: draft.id, key: attempt.key, hash }),
          });
        }

        if (attempt.hash) {
          const result = await request(attempt.hash);
          if (!active) return;
          if (result.deployment) {
            setDeployment(result.deployment);
            if (result.deployment.status === 'deployed') {
              setStage('vault-setup');
              void loadDetail(result.deployment.pipelineId);
            }
            return;
          }
        }

        const prepared = await request();
        if (!active) return;
        if (prepared.deployment) {
          setDeployment(prepared.deployment);
          if (prepared.deployment.status === 'deployed') {
            setStage('vault-setup');
            void loadDetail(prepared.deployment.pipelineId);
          }
          return;
        }

        if (!prepared.transaction) {
          throw new Error('Lasna deployment quote is unavailable. Please verify network.');
        }
        setQuote(prepared.transaction);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unable to calculate deployment quote.');
      } finally {
        if (active) setBusy(false);
      }
    }

    void initQuote();
    return () => {
      active = false;
    };
  }, [draft.id, owner, storageKey]);

  // Stage 1 Action: Deploy on Lasna
  async function handleDeployLasna() {
    if (locked.current || !quote) return;
    locked.current = true;
    setBusy(true);
    setError(undefined);
    try {
      const saved = localStorage.getItem(storageKey);
      const attempt = saved ? (JSON.parse(saved) as { key: string; hash?: Hash }) : { key: crypto.randomUUID() };
      localStorage.setItem(storageKey, JSON.stringify(attempt));

      async function request(hash?: Hash) {
        return workspaceRequest<DeployResponse>(owner, '/pipeline/take-profit/deploy', {
          method: 'POST',
          body: JSON.stringify({ graph, draftId: draft.id, key: attempt.key, hash }),
        });
      }

      if (attempt.hash) {
        const result = await request(attempt.hash);
        setDeployment(result.deployment);
        if (result.deployment?.status === 'deployed') {
          setStage('vault-setup');
          await loadDetail(result.deployment.pipelineId);
        }
        return;
      }

      if (getAccount(wagmiConfig).chainId !== 5318007) {
        await switchChain(wagmiConfig, { chainId: 5318007 });
      }

      const provider = await lasnaWallet(owner);
      const accounts = await provider.request({ method: 'eth_accounts' });
      if (!accounts.some((address) => isAddressEqual(address, owner))) throw new WalletPermissionRequired();

      const hash = await sendTransaction(wagmiConfig, {
        account: owner,
        chainId: 5318007,
        data: quote.data,
        type: 'legacy',
        gas: BigInt(quote.gas),
        gasPrice: BigInt(quote.gasPrice),
        value: BigInt(quote.value),
      });

      localStorage.setItem(storageKey, JSON.stringify({ ...attempt, hash }));

      const submitted = await request(hash);
      setDeployment(submitted.deployment);

      if (submitted.deployment?.status === 'signed') {
        await waitForTransactionReceipt(wagmiConfig, { chainId: 5318007, hash, timeout: 25_000, checkReplacement: false });
        const reconciled = await request(hash);
        setDeployment(reconciled.deployment);
        if (reconciled.deployment?.status === 'deployed') {
          setStage('vault-setup');
          await loadDetail(reconciled.deployment.pipelineId);
        }
      } else if (submitted.deployment?.status === 'deployed') {
        setStage('vault-setup');
        await loadDetail(submitted.deployment.pipelineId);
      }
    } catch (err) {
      if (err instanceof WalletPermissionRequired || hasWalletError(err, 4100)) {
        setNeedsPermission(true);
        setError('MetaMask did not authorize this request. Unlock the wallet and reconnect the Vault owner on Lasna.');
      } else if (hasWalletError(err, 4001)) {
        setError('The wallet request was declined. You can try again.');
      } else {
        setError(err instanceof BaseError ? err.shortMessage : err instanceof Error ? err.message : 'Unable to deploy Take-Profit.');
      }
    } finally {
      setBusy(false);
      locked.current = false;
    }
  }

  // Stage 2 Action: Execute next step on Base Sepolia
  async function handleExecuteStep(stepKind: 'register-rsc' | 'price-policy' | 'principal' | 'callback-reserve' | 'authorization') {
    if (!deployment || busy) return;
    setBusy(true);
    setError(undefined);
    try {
      const isFunding = stepKind === 'principal' || stepKind === 'callback-reserve';
      const amountStr = stepKind === 'principal' ? principalAmount : callbackAmount;
      const value = isFunding ? parseEther(amountStr) : undefined;

      await runDeploymentAction(owner, deployment, stepKind, value, graph);
      await loadDetail(deployment.pipelineId);
    } catch (err) {
      if (err instanceof WorkspaceWalletPromptCancelled) return;
      setError(err instanceof Error ? err.message : 'Step execution failed on Base Sepolia.');
    } finally {
      setBusy(false);
    }
  }

  async function reconnectWallet() {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError(undefined);
    try {
      const provider = await lasnaWallet(owner);
      await provider.request({ method: 'wallet_requestPermissions', params: [{ eth_accounts: {} }] });
      const accounts = await provider.request({ method: 'eth_accounts' });
      if (!accounts.some((address) => isAddressEqual(address, owner))) {
        throw new Error('Select the Vault owner account when MetaMask asks which accounts to connect.');
      }
      setNeedsPermission(false);
    } catch (err) {
      setError(
        hasWalletError(err, 4001)
          ? 'Wallet access was declined.'
          : 'Open MetaMask and connect the Vault owner to this site, then try signing again.'
      );
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  const resolved = resolvePhaseTwo(graph);
  if (resolved.type !== 'price-order' || resolved.config.mode !== 1) return null;
  const { config } = resolved;

  // Gas and funding calculation
  const gas = quote
    ? `Up to ${formatEther(BigInt(quote.gas) * BigInt(quote.gasPrice))} lREACT`
    : 'Calculating quote…';
  const funding = quote ? (
    <span className="font-semibold text-emerald-400">{formatEther(BigInt(quote.value))} lREACT</span>
  ) : (
    'Calculating quote…'
  );

  // Stage 2 Checklist evaluation
  const onboarding = detail?.runtime?.base?.onboarding;
  const isPolicyMismatch = onboarding === 'policy-mismatch';
  const isRegistered = Boolean(detail?.steps.some((s) => s.kind === 'register-rsc') || (onboarding && onboarding !== 'register-rsc'));
  const isPolicyConfigured = Boolean(detail?.steps.some((s) => s.kind === 'price-policy') || (onboarding === null && isRegistered));
  const principalBalance = detail?.runtime?.base?.principal ? BigInt(detail.runtime.base.principal) : 0n;
  const isPrincipalFunded = principalBalance > 0n || Boolean(detail?.steps.some((s) => s.kind === 'principal'));
  const callbackReserves = detail?.runtime?.base?.callback?.reserves ? BigInt(detail.runtime.base.callback.reserves) : 0n;
  const callbackBudget = detail?.runtime?.base?.callback?.budget ? BigInt(detail.runtime.base.callback.budget) : 0n;
  const isCallbackFunded = (callbackReserves >= callbackBudget && callbackBudget > 0n) || Boolean(detail?.steps.some((s) => s.kind === 'callback-reserve'));
  const isAuthorized = Boolean(detail?.runtime?.base?.authorized || detail?.steps.some((s) => s.kind === 'authorization'));
  const isAllReady = isRegistered && isPolicyConfigured && isPrincipalFunded && isCallbackFunded && isAuthorized;

  // Determine the next step in Stage 2
  let nextStep: 'register-rsc' | 'price-policy' | 'principal' | 'callback-reserve' | 'authorization' | 'done' = 'done';
  if (isPolicyMismatch) {
    nextStep = 'price-policy';
  } else if (!isRegistered) {
    nextStep = 'register-rsc';
  } else if (!isPolicyConfigured) {
    nextStep = 'price-policy';
  } else if (!isPrincipalFunded) {
    nextStep = 'principal';
  } else if (!isCallbackFunded) {
    nextStep = 'callback-reserve';
  } else if (!isAuthorized) {
    nextStep = 'authorization';
  }

  // Render Stage 2: Vault Setup on Base Sepolia
  if (stage === 'vault-setup' && deployment) {
    return (
      <DeployDialog
        busy={busy}
        onClose={onClose}
        error={error}
        title="Set up Vault on Base Sepolia"
        subtitle="Stage 2 of 2: Configure PriceOrderVault & Authorize Execution"
        icon={<ShieldCheck className="size-4" />}
      >
        {/* Pipeline Summary Bar */}
        <div className="rounded-lg border border-[var(--ws-border)] bg-[#111318] p-3 text-xs space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-[var(--ws-border)]">
            <span className="text-[var(--ws-muted)]">Reactive Smart Contract (Lasna)</span>
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 font-mono text-[10px] text-emerald-400 font-medium">
                DEPLOYED
              </span>
              <a
                href={`https://lasna.reactscan.net/tx/${deployment.contracts.rscTxHash}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[11px] text-[var(--ws-accent)] hover:underline inline-flex items-center gap-0.5"
              >
                {truncateAddress(deployment.contracts.rscAddress ?? undefined)}
                <ExternalLink className="size-2.5" />
              </a>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--ws-muted)]">Destination Price Order Vault (Base)</span>
            <a
              href={`https://sepolia.basescan.org/address/${deployment.contracts.vaultAddress}`}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[11px] text-zinc-300 hover:underline inline-flex items-center gap-0.5"
            >
              {truncateAddress(deployment.contracts.vaultAddress)}
              <ExternalLink className="size-2.5 text-zinc-500" />
            </a>
          </div>
        </div>

        {/* Policy Mismatch Blocking Banner */}
        {isPolicyMismatch && (
          <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
            <AlertCircle className="size-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-300">On-Chain Policy Mismatch</p>
              <p className="text-[11px] leading-relaxed mt-0.5 text-rose-300/90">
                The PriceOrderVault on Base Sepolia already has an existing policy for this RSC that differs from this revision.
                Vault policies are immutable once configured.
              </p>
            </div>
          </div>
        )}

        {/* 5-Step Checklist */}
        <div className="rounded-lg border border-[var(--ws-border)] bg-[#111318] p-3 text-xs space-y-2.5">
          <span className="font-medium text-zinc-300">Base Sepolia Setup Checklist</span>

          <ul className="space-y-2">
            {/* Step 1 */}
            <li className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {isRegistered ? (
                  <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                ) : nextStep === 'register-rsc' ? (
                  <div className="size-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin shrink-0" />
                ) : (
                  <Circle className="size-4 text-zinc-600 shrink-0" />
                )}
                <span className={isRegistered ? 'text-zinc-200 font-medium' : 'text-zinc-400'}>
                  1. Register RSC with PriceOrderVault
                </span>
              </div>
              <span className="text-[10px] font-mono text-[var(--ws-muted)]">
                {isRegistered ? 'Completed' : 'Pending'}
              </span>
            </li>

            {/* Step 2 */}
            <li className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {isPolicyConfigured ? (
                  <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                ) : isPolicyMismatch ? (
                  <AlertCircle className="size-4 text-rose-400 shrink-0" />
                ) : nextStep === 'price-policy' ? (
                  <div className="size-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin shrink-0" />
                ) : (
                  <Circle className="size-4 text-zinc-600 shrink-0" />
                )}
                <span className={isPolicyConfigured ? 'text-zinc-200 font-medium' : isPolicyMismatch ? 'text-rose-300 font-medium' : 'text-zinc-400'}>
                  2. Configure Take-Profit Policy ({config.percent}% @ ≥ ${formatEther(config.threshold)})
                </span>
              </div>
              <span className="text-[10px] font-mono text-[var(--ws-muted)]">
                {isPolicyConfigured ? 'Completed' : isPolicyMismatch ? 'Mismatch' : 'Pending'}
              </span>
            </li>

            {/* Step 3 */}
            <li className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {isPrincipalFunded ? (
                  <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                ) : nextStep === 'principal' ? (
                  <div className="size-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin shrink-0" />
                ) : (
                  <Circle className="size-4 text-zinc-600 shrink-0" />
                )}
                <span className={isPrincipalFunded ? 'text-zinc-200 font-medium' : 'text-zinc-400'}>
                  3. Deposit Vault Principal ({principalBalance > 0n ? `${formatEther(principalBalance)} ETH` : `${principalAmount} ETH`})
                </span>
              </div>
              <span className="text-[10px] font-mono text-[var(--ws-muted)]">
                {isPrincipalFunded ? 'Funded' : 'Required'}
              </span>
            </li>

            {/* Step 4 */}
            <li className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {isCallbackFunded ? (
                  <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                ) : nextStep === 'callback-reserve' ? (
                  <div className="size-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin shrink-0" />
                ) : (
                  <Circle className="size-4 text-zinc-600 shrink-0" />
                )}
                <span className={isCallbackFunded ? 'text-zinc-200 font-medium' : 'text-zinc-400'}>
                  4. Fund Callback Reserve ({callbackReserves > 0n ? `${formatEther(callbackReserves)} ETH` : `${callbackAmount} ETH`})
                </span>
              </div>
              <span className="text-[10px] font-mono text-[var(--ws-muted)]">
                {isCallbackFunded ? 'Funded' : 'Recommended'}
              </span>
            </li>

            {/* Step 5 */}
            <li className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {isAuthorized ? (
                  <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                ) : nextStep === 'authorization' ? (
                  <div className="size-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin shrink-0" />
                ) : (
                  <Circle className="size-4 text-zinc-600 shrink-0" />
                )}
                <span className={isAuthorized ? 'text-zinc-200 font-medium' : 'text-zinc-400'}>
                  5. Authorize RSC Execution Permission
                </span>
              </div>
              <span className="text-[10px] font-mono text-[var(--ws-muted)]">
                {isAuthorized ? 'Authorized' : 'Required'}
              </span>
            </li>
          </ul>
        </div>

        {/* Funding Input Adjusters if step 3 or 4 is active */}
        {!isAllReady && (nextStep === 'principal' || nextStep === 'callback-reserve') && (
          <div className="rounded-lg border border-[var(--ws-border)] bg-[#111318] p-3 text-xs flex items-center justify-between gap-3">
            <span className="text-zinc-300">
              {nextStep === 'principal' ? 'Deposit ETH amount to Vault:' : 'Fund Callback Reserve amount:'}
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={nextStep === 'principal' ? principalAmount : callbackAmount}
                onChange={(e) => (nextStep === 'principal' ? setPrincipalAmount(e.target.value.trim()) : setCallbackAmount(e.target.value.trim()))}
                className="w-24 rounded border border-[var(--ws-border)] bg-[#0d0e15] px-2 py-1 font-mono text-xs text-white"
                placeholder="0.05"
              />
              <span className="font-mono text-xs text-zinc-400">ETH</span>
            </div>
          </div>
        )}

        {/* Modal Action Bar */}
        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--ws-border)] pt-2">
          <button className="ws-button" type="button" disabled={busy} onClick={onClose} title="You can close anytime; all progress is saved and can be continued in Active Automations">
            Close
          </button>

          {isAllReady ? (
            <Link
              className="ws-button ws-button-primary flex-1 justify-center inline-flex items-center gap-1.5 min-h-[2.5rem]"
              href={`/workspace/active/${deployment.pipelineId}`}
            >
              <CheckCircle2 className="size-4 text-emerald-400" />
              <span>Ready to Monitor &bull; Open in Active</span>
            </Link>
          ) : isPolicyMismatch ? (
            <button className="ws-button flex-1 justify-center text-rose-300 opacity-60 cursor-not-allowed" disabled>
              Policy Mismatched on Base Sepolia
            </button>
          ) : (
            <button
              className="ws-button ws-button-primary flex-1 justify-center inline-flex items-center gap-1.5 min-h-[2.5rem]"
              type="button"
              disabled={busy}
              onClick={() => void handleExecuteStep(nextStep as any)}
            >
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Confirming on Base Sepolia…</span>
                </>
              ) : nextStep === 'register-rsc' ? (
                <>
                  <ShieldCheck className="size-4" />
                  <span>1. Register RSC with Vault</span>
                </>
              ) : nextStep === 'price-policy' ? (
                <>
                  <KeyRound className="size-4" />
                  <span>2. Configure Take-Profit Policy</span>
                </>
              ) : nextStep === 'principal' ? (
                <>
                  <Coins className="size-4" />
                  <span>3. Deposit {principalAmount} ETH Principal</span>
                </>
              ) : nextStep === 'callback-reserve' ? (
                <>
                  <Coins className="size-4" />
                  <span>4. Fund {callbackAmount} ETH Callback Reserve</span>
                </>
              ) : (
                <>
                  <KeyRound className="size-4" />
                  <span>5. Authorize RSC Execution</span>
                </>
              )}
            </button>
          )}
        </div>
      </DeployDialog>
    );
  }

  // Render Stage 1: Lasna Deployment Confirmation
  return (
    <DeployDialog
      busy={busy}
      onClose={onClose}
      error={error ?? (deployment?.status === 'reverted' ? 'The Lasna transaction reverted.' : undefined)}
      title="Deploy Take-Profit Scalper"
      subtitle="Stage 1 of 2: Reactive Smart Contract on Lasna"
      icon={<Rocket className="size-4" />}
    >
      <DeploySummary
        nodes={graph.nodes.length}
        edges={graph.edges.length}
        trigger={`Trigger at or above $${formatEther(config.threshold)} USD`}
        execution={<>Cooldown {config.cooldown.toString()}s &bull; Swap {config.percent}%</>}
        vault={config.vault}
        vaultLabel="Price Order Vault"
        owner={owner}
        gas={gas}
        funding={funding}
        notice="Stage 1 deploys your RSC on Reactive Lasna. Once confirmed, this modal automatically transitions to Stage 2 on Base Sepolia to configure and fund your Price Order Vault."
      />

      {deployment?.status === 'signed' && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-amber-300 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin shrink-0 text-amber-400" />
            <span>Awaiting Lasna receipt…</span>
          </div>
          {deployment.contracts.rscTxHash && (
            <a
              className="text-xs font-mono text-[var(--ws-accent)] hover:underline inline-flex items-center gap-0.5"
              href={`https://lasna.reactscan.net/tx/${deployment.contracts.rscTxHash}`}
              target="_blank"
              rel="noreferrer"
            >
              <span>View tx</span>
              <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-[var(--ws-border)] pt-2">
        <button className="ws-button" type="button" disabled={busy} onClick={onClose}>
          Cancel
        </button>

        {needsPermission && (
          <button className="ws-button" type="button" disabled={busy} onClick={() => void reconnectWallet()}>
            Reconnect MetaMask
          </button>
        )}

        {deployment?.status === 'reverted' ? (
          <button
            className="ws-button flex-1"
            type="button"
            onClick={() => {
              localStorage.removeItem(storageKey);
              setDeployment(undefined);
              setQuote(undefined);
            }}
          >
            Start new attempt
          </button>
        ) : error && !quote ? (
          <button
            className="ws-button ws-button-primary min-h-[2.5rem] flex-1 justify-center inline-flex items-center gap-1.5"
            type="button"
            disabled={busy}
            onClick={() => {
              setError(undefined);
              const attempt = { key: crypto.randomUUID() };
              localStorage.setItem(storageKey, JSON.stringify(attempt));
              setBusy(true);
              void workspaceRequest<DeployResponse>(owner, '/pipeline/take-profit/deploy', {
                method: 'POST',
                body: JSON.stringify({ graph, draftId: draft.id, key: attempt.key }),
              })
                .then((res) => {
                  if (res.transaction) setQuote(res.transaction);
                  if (res.deployment?.status === 'deployed') {
                    setStage('vault-setup');
                    void loadDetail(res.deployment.pipelineId);
                  }
                })
                .catch((err) => setError(err instanceof Error ? err.message : 'Quote failed.'))
                .finally(() => setBusy(false));
            }}
          >
            <RotateCcw className="size-4" />
            <span>Retry quote</span>
          </button>
        ) : (
          <button
            className="ws-button ws-button-primary min-h-[2.5rem] flex-1 justify-center inline-flex items-center gap-1.5"
            type="button"
            disabled={busy || !quote}
            onClick={() => void handleDeployLasna()}
          >
            {busy ? (
              <>
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                <span>{deployment?.status === 'signed' ? 'Checking Lasna receipt…' : 'Signing on Lasna…'}</span>
              </>
            ) : !quote ? (
              <>
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                <span>Calculating quote…</span>
              </>
            ) : (
              <>
                <Rocket aria-hidden="true" className="size-4" />
                <span>Deploy on Lasna</span>
              </>
            )}
          </button>
        )}
      </div>
    </DeployDialog>
  );
}
