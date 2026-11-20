'use client';

import { useState } from 'react';
import { encodeDeployData, isAddress, isAddressEqual, zeroAddress, type Address, type Hash } from 'viem';
import { getAccount, sendTransaction, waitForTransactionReceipt } from 'wagmi/actions';
import { ACTION_VAULT_ABI, ACTION_VAULT_BYTECODE, STOP_LOSS_TEMPLATE } from '@omniflow/shared';
import { wagmiConfig } from '@/lib/wagmi';
import { workspaceRequest } from '@/lib/workspaceSession';

const fieldClass = 'w-full rounded-md border border-[var(--ws-border)] bg-[#0d0e15] px-2.5 py-2 font-mono text-xs text-slate-100';

export function VaultSetup({ owner, pair, currentVault, onLinked }: {
  owner: Address;
  pair: Address;
  currentVault: string;
  onLinked: (address: Address) => void;
}) {
  const pendingKey = `omniflow.vault-create.v1.${owner.toLowerCase()}.${pair.toLowerCase()}`;
  const [creationHash, setCreationHash] = useState(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(pendingKey) : null;
    return stored && /^0x[0-9a-f]{64}$/i.test(stored) ? stored as Hash : undefined;
  });
  const [mode, setMode] = useState<'link' | 'create'>(creationHash ? 'create' : 'link');
  const [candidate, setCandidate] = useState(currentVault);
  const [router, setRouter] = useState('');
  const [backup, setBackup] = useState<Address | string>(owner);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [linked, setLinked] = useState<Address>();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    try {
      let vault: string = candidate;
      let hash = mode === 'create' ? creationHash : undefined;
      if (mode === 'create') {
        if (!hash) {
          if (!isAddress(router) || !isAddress(backup) || isAddressEqual(backup, zeroAddress)) {
            throw new Error('Enter valid router and backup wallet addresses.');
          }
          const { quote } = await workspaceRequest<{ quote: Address }>(owner, '/pipeline/vaults/market', {
            method: 'POST', body: JSON.stringify({ pair, router }),
          });
          const wallet = getAccount(wagmiConfig);
          if (!wallet.address || !isAddressEqual(wallet.address, owner) || wallet.chainId !== 84532) {
            throw new Error('Connect the Vault owner on Base Sepolia.');
          }
          hash = await sendTransaction(wagmiConfig, {
            account: owner, chainId: 84532,
            data: encodeDeployData({
              abi: ACTION_VAULT_ABI, bytecode: ACTION_VAULT_BYTECODE,
              args: [STOP_LOSS_TEMPLATE.callbackProxy, backup, router, quote, pair],
            }),
          });
          setCreationHash(hash);
          localStorage.setItem(pendingKey, hash);
        }
        const receipt = await waitForTransactionReceipt(wagmiConfig, { chainId: 84532, hash, checkReplacement: false });
        if (receipt.status !== 'success' || !receipt.contractAddress) {
          setCreationHash(undefined);
          localStorage.removeItem(pendingKey);
          throw new Error('The Vault creation transaction reverted.');
        }
        vault = receipt.contractAddress;
        setCandidate(vault);
      }
      if (!isAddress(vault)) throw new Error('Enter a valid Vault address.');
      const result = await workspaceRequest<{ vault: { address: Address } }>(owner, '/pipeline/vaults/link', {
        method: 'POST', body: JSON.stringify({ vault, pair, creationTxHash: hash }),
      });
      onLinked(result.vault.address);
      setLinked(result.vault.address);
      if (hash) localStorage.removeItem(pendingKey);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Vault setup failed.');
    } finally {
      setPending(false);
    }
  }

  return (
    <details className="border-t border-[var(--ws-border)] pt-3">
      <summary className="cursor-pointer text-sm font-medium text-slate-100">Create or link a Vault</summary>
      <form className="mt-3 space-y-3" onSubmit={submit}>
        <label className="block space-y-1">
          <span>Setup method</span>
          <select className={fieldClass} value={mode} disabled={pending}
            onChange={event => setMode(event.target.value === 'create' ? 'create' : 'link')}>
            <option value="link">Link existing Vault</option>
            <option value="create">Create on Base Sepolia</option>
          </select>
        </label>
        {mode === 'link' ? (
          <label className="block space-y-1">
            <span>Vault address</span>
            <input className={fieldClass} value={candidate} onChange={event => setCandidate(event.target.value.trim())} required />
          </label>
        ) : (
          <>
            <label className="block space-y-1">
              <span>Router for the selected pool</span>
              <input className={fieldClass} value={router} disabled={Boolean(creationHash) || pending}
                onChange={event => setRouter(event.target.value.trim())} required />
            </label>
            <label className="block space-y-1">
              <span>Emergency sweep recipient</span>
              <input className={fieldClass} value={backup} disabled={Boolean(creationHash) || pending}
                onChange={event => setBackup(event.target.value.trim())} required />
            </label>
          </>
        )}
        {creationHash && <a className="ws-address block" href={`https://sepolia.basescan.org/tx/${creationHash}`}>Vault creation transaction</a>}
        {error && <p role="alert" className="break-words text-rose-300">{error}</p>}
        {linked && <p role="status" className="text-emerald-300">Vault verified and applied to this swap.</p>}
        <button type="submit" className="ws-button" disabled={pending || Boolean(linked)}>
          {pending ? 'Checking Vault…' : mode === 'link' ? 'Verify and link Vault' : creationHash ? 'Check creation receipt' : 'Create and link Vault'}
        </button>
      </form>
    </details>
  );
}
