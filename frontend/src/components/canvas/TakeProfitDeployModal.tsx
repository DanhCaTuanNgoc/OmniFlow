'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { formatEther, isAddressEqual, type Address, type Hash, type Hex } from 'viem';
import { getAccount, sendTransaction, switchChain, waitForTransactionReceipt } from 'wagmi/actions';
import type { StopLossGraph } from '@omniflow/shared';
import type { DeploymentSummary } from '@/lib/deployments';
import { wagmiConfig } from '@/lib/wagmi';
import { workspaceRequest } from '@/lib/workspaceSession';

type Quote = { data: Hex; gas: string; gasPrice: string; value: string };
type DeployResponse = { transaction?: Quote; deployment?: DeploymentSummary };

export function TakeProfitDeployModal({ owner, graph, draft, onClose }: {
  owner: Address;
  graph: StopLossGraph & { metadata: { name: string; ownerAddress: Address; description?: string } };
  draft: { id: string; updatedAt: number };
  onClose: () => void;
}) {
  const [quote, setQuote] = useState<Quote>();
  const [deployment, setDeployment] = useState<DeploymentSummary>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const locked = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
    return () => { if (element?.open) element.close(); };
  }, []);
  const storageKey = `omniflow.take-profit.v1.${owner.toLowerCase()}.${draft.id}.${draft.updatedAt}`;

  async function advance() {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError(undefined);
    try {
      const saved = localStorage.getItem(storageKey);
      const attempt = saved ? JSON.parse(saved) as { key: string; hash?: Hash } : { key: crypto.randomUUID() };
      localStorage.setItem(storageKey, JSON.stringify(attempt));
      async function request(hash?: Hash) {
        return workspaceRequest<DeployResponse>(owner, '/pipeline/take-profit/deploy', {
          method: 'POST', body: JSON.stringify({ graph, draftId: draft.id, key: attempt.key, hash }),
        });
      }
      if (attempt.hash) {
        const result = await request(attempt.hash);
        setDeployment(result.deployment);
        return;
      }
      const prepared = await request();
      if (prepared.deployment) {
        setDeployment(prepared.deployment);
        return;
      }
      if (!prepared.transaction) throw new Error('Lasna deployment quote is unavailable.');
      if (!quote || JSON.stringify(quote) !== JSON.stringify(prepared.transaction)) {
        setQuote(prepared.transaction);
        return;
      }
      await switchChain(wagmiConfig, { chainId: 5318007 });
      const account = getAccount(wagmiConfig);
      if (!account.address || !isAddressEqual(account.address, owner) || account.chainId !== 5318007) {
        throw new Error('Connect the Vault owner on Lasna to sign.');
      }
      const hash = await sendTransaction(wagmiConfig, {
        account: owner, chainId: 5318007, data: quote.data, type: 'legacy',
        gas: BigInt(quote.gas), gasPrice: BigInt(quote.gasPrice), value: BigInt(quote.value),
      });
      localStorage.setItem(storageKey, JSON.stringify({ ...attempt, hash }));
      const submitted = await request(hash);
      setDeployment(submitted.deployment);
      if (submitted.deployment?.status === 'signed') {
        await waitForTransactionReceipt(wagmiConfig, { chainId: 5318007, hash, timeout: 25_000, checkReplacement: false });
        setDeployment((await request(hash)).deployment);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to deploy Take-Profit.');
    } finally {
      setBusy(false);
      locked.current = false;
    }
  }

  return (
    <dialog ref={dialog} aria-labelledby="take-profit-deploy-title" onCancel={event => {
      event.preventDefault();
      if (!busy) onClose();
    }} className="w-[calc(100%-2rem)] max-w-md space-y-4 rounded-xl border border-[var(--ws-border)] bg-[var(--ws-rail)] p-5 text-white backdrop:bg-black/80">
        <h2 id="take-profit-deploy-title" className="text-base font-semibold text-white">Deploy Take-Profit</h2>
        <p className="text-sm text-slate-200">Sign the Lasna deployment with your connected wallet. Then open Active to configure the Price Order Vault on Base Sepolia.</p>
        {quote && <p className="text-sm tabular-nums text-slate-200">
          {formatEther(BigInt(quote.value))} lREACT for the RSC and up to {formatEther(BigInt(quote.gas) * BigInt(quote.gasPrice))} lREACT for deployment gas.
        </p>}
        {error && <p role="alert" className="break-words text-sm text-rose-300">{error}</p>}
        {deployment?.status === 'reverted' && <p role="alert" className="text-sm text-rose-300">The Lasna transaction reverted.</p>}
        {deployment && <a className="ws-address block" href={`https://lasna.reactscan.net/tx/${deployment.contracts.rscTxHash}`}>View Lasna transaction</a>}
        <div className="flex flex-wrap gap-2">
          <button className="ws-button" type="button" disabled={busy} onClick={onClose}>Close</button>
          {deployment?.status === 'deployed'
            ? <Link className="ws-button ws-button-primary" href={`/workspace/active/${deployment.pipelineId}`}>Set up Vault in Active</Link>
            : deployment?.status === 'reverted'
              ? <button className="ws-button" type="button" onClick={() => {
                localStorage.removeItem(storageKey);
                setDeployment(undefined);
                setQuote(undefined);
              }}>Start new attempt</button>
              : <button className="ws-button ws-button-primary" type="button" disabled={busy} onClick={() => void advance()}>
                {busy ? 'Working...' : deployment?.status === 'signed' ? 'Check Lasna receipt' : quote ? 'Sign on Lasna' : 'Check deployment'}
              </button>}
        </div>
    </dialog>
  );
}
