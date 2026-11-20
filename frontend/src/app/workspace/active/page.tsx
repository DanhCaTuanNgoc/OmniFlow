'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { formatEther, parseEther, type Address } from 'viem';
import { WorkspacePageHeader, WorkspaceState } from '@/components/common/WorkspaceUI';
import { runDeploymentAction, type DeploymentDetail, type DeploymentSummary } from '@/lib/deployments';
import { workspaceRequest } from '@/lib/workspaceSession';

const runtimeLabel = {
  unverified: 'RPC data unavailable',
  'awaiting-authorization': 'Awaiting Vault permission',
  'awaiting-principal': 'Awaiting principal',
  'awaiting-fees': 'Awaiting fees',
  ready: 'Ready at last check',
};
const stepLabels = {
  authorization: 'Authorize RSC',
  principal: 'Deposit principal',
  'callback-reserve': 'Fund callback reserve',
  'reactive-reserve': 'Fund Reactive reserve',
};

export default function ActiveAutomationsPage() {
  return <Suspense fallback={<WorkspaceState title="Loading Active Automations…" />}><ActiveRoute /></Suspense>;
}

function ActiveRoute() {
  const { address, isConnected } = useAccount();
  const id = useSearchParams().get('deployment');
  return (
    <div className="ws-page">
      <WorkspacePageHeader title="Active Automations" description="Reopen a deployment and check permissions, principal and fee reserves." />
      {isConnected && address
        ? <WalletDeployments key={address} owner={address} selectedId={id} />
        : <WorkspaceState title="Connect a wallet to view your automations." action={{ label: 'Open Studio', href: '/workspace/studio' }} />}
    </div>
  );
}

function WalletDeployments({ owner, selectedId }: { owner: Address; selectedId: string | null }) {
  const router = useRouter();
  const [list, setList] = useState<DeploymentSummary[]>();
  const [detail, setDetail] = useState<DeploymentDetail>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function load(id = selectedId) {
    setPending(true);
    setError(undefined);
    try {
      const result = await workspaceRequest<{ deployments: DeploymentSummary[] }>(owner, '/pipeline/deployments');
      setList(result.deployments);
      setDetail(id ? await workspaceRequest<DeploymentDetail>(owner, `/pipeline/deployments/${encodeURIComponent(id)}`) : undefined);
    } catch (error) {
      setDetail(undefined);
      setError(error instanceof Error ? error.message : 'Unable to load deployments.');
    } finally {
      setPending(false);
    }
  }

  function select(id: string) {
    router.replace(`/workspace/active?deployment=${id}`, { scroll: false });
    void load(id);
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="ws-button" onClick={() => void load()} disabled={pending}>
          {pending ? 'Checking deployments…' : list ? 'Refresh deployments' : 'Load my deployments'}
        </button>
        <Link href="/workspace/studio" className="ws-button">Open Studio</Link>
      </div>
      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
      {list && (list.length === 0 ? <WorkspaceState title="This wallet has no recorded deployments."
        action={{ label: 'View public testnet proof', href: '/#proof' }} /> : (
        <ul className="ws-panel divide-y divide-[var(--ws-border)]">
          {list.map(deployment => (
            <li key={deployment.pipelineId} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="break-words text-sm font-semibold">{deployment.name}</p>
                <p className="break-all text-xs text-[var(--ws-muted)]">{deployment.template} · {deployment.revisionId}</p>
              </div>
              <button type="button" disabled={pending} onClick={() => select(deployment.pipelineId)} className="ws-button"
                aria-current={deployment.pipelineId === selectedId ? 'true' : undefined}>
                {deployment.status === 'signed' ? 'Check pending receipt' : 'Open deployment'}
              </button>
            </li>
          ))}
        </ul>
      ))}
      {detail?.pipelineId === selectedId && <DeploymentPanel key={detail.pipelineId} deployment={detail} owner={owner} reload={() => load(detail.pipelineId)} />}
    </>
  );
}

function DeploymentPanel({ deployment, owner, reload }: {
  deployment: DeploymentDetail; owner: Address; reload: () => Promise<void>;
}) {
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState<string>();
  const [message, setMessage] = useState<{ text: string; error: boolean }>();
  const { contracts, runtime, status } = deployment;

  async function doStep(kind: keyof typeof stepLabels) {
    setBusy(kind);
    setMessage(undefined);
    try {
      if (kind !== 'authorization' && amount && !/^\d+(\.\d{1,18})?$/.test(amount)) {
        throw new Error('Enter a decimal amount with up to 18 places.');
      }
      await runDeploymentAction(owner, deployment, kind, kind === 'authorization' || !amount ? undefined : parseEther(amount));
      setAmount('');
      setMessage({ text: 'Receipt verified and saved.', error: false });
      await reload();
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'Unable to complete the step.', error: true });
    } finally {
      setBusy(undefined);
    }
  }

  async function retryDeployment() {
    setBusy('deploy');
    setMessage(undefined);
    try {
      const result = await workspaceRequest<DeploymentSummary>(owner, '/pipeline/compile-and-deploy', {
        method: 'POST', headers: {
          'Idempotency-Key': deployment.requestKey,
          ...(deployment.workspacePipelineId ? { 'Workspace-Pipeline-Id': deployment.workspacePipelineId } : {}),
        }, body: JSON.stringify(deployment.graph),
      });
      if (result.status === 'signed') setMessage({ text: 'The stored Lasna transaction is still awaiting its receipt.', error: false });
      await reload();
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'Unable to resume the deployment.', error: true });
    } finally {
      setBusy(undefined);
    }
  }

  const label = runtime ? runtimeLabel[runtime.status] : status === 'reverted'
    ? 'Lasna deployment reverted' : 'Waiting for Lasna receipt';
  return (
    <section className="ws-panel space-y-4 p-4 md:p-5" aria-label="Selected deployment">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold">{deployment.name}</h2>
        <span className="ws-badge">{label}</span>
      </div>
      <dl className="grid gap-3 text-sm md:grid-cols-2">
        <dt className="text-[var(--ws-muted)]">Base Sepolia Vault</dt>
        <dd><a className="ws-address break-all" href={`https://sepolia.basescan.org/address/${contracts.vaultAddress}`}>{contracts.vaultAddress}</a></dd>
        <dt className="text-[var(--ws-muted)]">{status === 'signed' ? 'Stored Lasna transaction hash' : 'Lasna deployment transaction'}</dt>
        <dd className="break-all">{status === 'signed' ? <code>{contracts.rscTxHash}</code> :
          <a className="ws-address" href={`https://lasna.reactscan.net/tx/${contracts.rscTxHash}`}>{contracts.rscTxHash}</a>}</dd>
        {contracts.rscAddress && <>
          <dt className="text-[var(--ws-muted)]">Lasna RSC</dt>
          <dd><a className="ws-address break-all" href={`https://lasna.reactscan.net/address/${contracts.rscAddress}`}>{contracts.rscAddress}</a></dd>
        </>}
      </dl>
      {deployment.latestExecution && (
        <p className="text-sm text-[var(--ws-muted)]">
          Latest execution <span className="font-medium text-slate-100">{deployment.latestExecution.status.toLowerCase()}</span>
          {deployment.latestExecution.destinationTxHash && (
            <a className="ws-address ml-2" href={`https://sepolia.basescan.org/tx/${deployment.latestExecution.destinationTxHash}`}>Vault receipt</a>
          )}
        </p>
      )}
      {status === 'signed' && (
        <div className="space-y-2">
          {deployment.broadcastLimitReached && <p role="status" className="text-sm text-amber-200">Broadcast retry limit reached. Check the stored transaction for a receipt.</p>}
          <button type="button" className="ws-button" disabled={Boolean(busy)} onClick={() => void retryDeployment()}>
            {busy ? 'Checking Lasna…' : deployment.broadcastLimitReached ? 'Check stored receipt' : 'Resume stored deployment'}
          </button>
        </div>
      )}
      {runtime && <>
        <dl className="grid gap-3 border-t border-[var(--ws-border)] pt-3 text-sm tabular-nums md:grid-cols-2">
          <dt className="text-[var(--ws-muted)]">Vault permission</dt><dd>{runtime.base ? runtime.base.authorized ? 'Granted' : 'Awaiting owner' : 'Base RPC unavailable'}</dd>
          <dt className="text-[var(--ws-muted)]">Vault principal</dt><dd>{runtime.base ? `${formatEther(BigInt(runtime.base.principal))} ETH` : 'Base RPC unavailable'}</dd>
          <dt className="text-[var(--ws-muted)]">Callback reserve / debt</dt><dd>{runtime.base ? `${formatEther(BigInt(runtime.base.callback.reserves))} / ${formatEther(BigInt(runtime.base.callback.debt))} ETH` : 'Base RPC unavailable'}</dd>
          <dt className="text-[var(--ws-muted)]">RSC native balance</dt><dd>{runtime.lasna ? `${formatEther(BigInt(runtime.lasna.native))} lREACT` : 'Lasna RPC unavailable'}</dd>
          <dt className="text-[var(--ws-muted)]">Reactive reserve / debt</dt><dd>{runtime.lasna ? `${formatEther(BigInt(runtime.lasna.reactive.reserves))} / ${formatEther(BigInt(runtime.lasna.reactive.debt))} lREACT` : 'Lasna RPC unavailable'}</dd>
        </dl>
        <p className="text-xs text-[var(--ws-muted)]">Checked <time dateTime={runtime.readAt}>{new Date(runtime.readAt).toLocaleString()}</time></p>
        <div className="space-y-2 border-t border-[var(--ws-border)] pt-3">
          <label className="block text-sm">
            Funding amount in ETH or lREACT
            <input inputMode="decimal" value={amount} onChange={event => setAmount(event.target.value.trim())}
              className="ml-2 w-28 rounded-md border border-[var(--ws-border)] bg-[#0d0e15] px-2 py-1 tabular-nums" />
          </label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(stepLabels) as (keyof typeof stepLabels)[]).map(kind => (
              <button type="button" className="ws-button" key={kind} onClick={() => void doStep(kind)}
                disabled={Boolean(busy) || (kind === 'authorization' && runtime.base?.authorized && deployment.steps.some(step => step.kind === 'authorization'))}>
                {busy === kind ? 'Confirming…' : stepLabels[kind]}
              </button>
            ))}
          </div>
        </div>
      </>}
      {message && <p role={message.error ? 'alert' : 'status'} className={`break-words text-sm ${message.error ? 'text-rose-300' : 'text-emerald-300'}`}>{message.text}</p>}
      {deployment.steps.length > 0 && <ul className="space-y-1 border-t border-[var(--ws-border)] pt-3 text-sm">
        {deployment.steps.map(step => <li key={`${step.kind}:${step.txHash}`}>
          <a className="ws-address" href={`${step.chainId === 84532 ? 'https://sepolia.basescan.org' : 'https://lasna.reactscan.net'}/tx/${step.txHash}`}>{stepLabels[step.kind]} receipt</a>
        </li>)}
      </ul>}
      <div className="flex flex-wrap gap-2">
        <Link className="ws-button" href={`/workspace/studio?deployment=${deployment.pipelineId}`}>Open revision in Studio</Link>
        <Link className="ws-button" href={`/workspace/vault?deployment=${deployment.pipelineId}`}>Open Vault</Link>
        <Link className="ws-button" href={`/workspace/logs?deployment=${deployment.pipelineId}`}>Open activity</Link>
      </div>
    </section>
  );
}
