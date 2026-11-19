'use client';

import { WorkspacePageHeader, WorkspaceState } from '@/components/common/WorkspaceUI';
import { useAccount, useReadContract } from 'wagmi';
import { isAddress, isAddressEqual, parseAbi } from 'viem';
import { ACTION_VAULT_ABI } from '@omniflow/shared';
import { CONTRACT_ADDRESSES } from '@/lib/constants';

const rscAbi = parseAbi(['function actionVault() view returns (address)']);
const vault = CONTRACT_ADDRESSES.DEFAULT_ACTION_VAULT;
const rsc = CONTRACT_ADDRESSES.DEFAULT_RSC_STOP_LOSS;
const configured = isAddress(vault) && isAddress(rsc);

export default function ActiveAutomationsPage() {
  const { address, isConnected } = useAccount();
  const owner = useReadContract({
    address: vault, chainId: 84532, abi: ACTION_VAULT_ABI, functionName: 'owner',
    query: { enabled: isConnected && configured },
  });
  const isOwner = Boolean(isConnected && address && !owner.isError && owner.data && isAddressEqual(address, owner.data));
  const target = useReadContract({
    address: rsc, chainId: 5318007, abi: rscAbi, functionName: 'actionVault',
    query: { enabled: isOwner },
  });
  const authorization = useReadContract({
    address: vault, chainId: 84532, abi: ACTION_VAULT_ABI, functionName: 'authorizedRSCs', args: [rsc],
    query: { enabled: isOwner },
  });
  const verified = isOwner && !target.isError && !authorization.isError &&
    target.data && isAddressEqual(target.data, vault) && authorization.data !== undefined;

  const status = !isConnected ? 'Connect a wallet to view your automations.' :
    !configured ? 'Deployment addresses are invalid.' :
    owner.isError || (isOwner && (target.isError || authorization.isError)) ? 'Unable to verify the deployment on-chain.' :
    owner.isPending || (isOwner && (target.isPending || authorization.isPending)) ? 'Checking the configured deployment...' :
    'No verified deployment is linked to this wallet.';

  return (
    <div className="ws-page">
      <WorkspacePageHeader title="Active Automations" description="Review deployments and their Vault permissions." />
      {verified ? (
        <section aria-label="Verified deployment" className="ws-panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ws-border)] px-5 py-4">
            <h2 className="text-sm font-semibold">Stop-loss</h2>
            <span className={`ws-badge ${authorization.data ? 'ws-badge-ok' : ''}`}>
              {authorization.data ? 'Vault permission confirmed' : 'Vault permission not granted'}
            </span>
          </div>
          <dl className="grid gap-4 px-5 py-4 text-sm md:grid-cols-2">
            <div className="min-w-0">
              <dt className="mb-1 text-xs text-[var(--ws-muted)]">Reactive Lasna / RSC</dt>
              <dd><a className="ws-address" href={`https://lasna.reactscan.net/address/${rsc}`}>{rsc}</a></dd>
            </div>
            <div className="min-w-0">
              <dt className="mb-1 text-xs text-[var(--ws-muted)]">Base Sepolia / Vault</dt>
              <dd><a className="ws-address" href={`https://sepolia.basescan.org/address/${vault}`}>{vault}</a></dd>
            </div>
          </dl>
        </section>
      ) : <WorkspaceState title={status} action={{ label: 'Open Studio', href: '/workspace/studio' }} />}
    </div>
  );
}
