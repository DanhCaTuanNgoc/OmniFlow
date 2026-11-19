'use client';

import { Cpu } from 'lucide-react';
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

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <header className="flex items-center gap-3 pb-4 border-b border-white/10">
        <Cpu aria-hidden="true" className="w-5 h-5 text-slate-300" />
        <h1 className="text-xl font-bold text-white font-display">Active Automations</h1>
      </header>
      {verified ? (
        <section aria-label="Verified deployment" className="space-y-3 rounded-xl border border-white/10 p-4 text-sm text-slate-300">
          <h2 className="font-semibold text-white">Stop-loss on Reactive Lasna</h2>
          <p>{authorization.data ? 'Vault permission confirmed' : 'Vault permission not granted'}</p>
          <a className="block break-all text-cyan-300 underline" href={`https://lasna.reactscan.net/address/${rsc}`}>
            RSC {rsc}
          </a>
          <a className="block break-all text-cyan-300 underline" href={`https://sepolia.basescan.org/address/${vault}`}>
            Vault {vault}
          </a>
        </section>
      ) : (
        <p role="status" className="text-sm text-slate-300">
          {!isConnected ? 'Connect a wallet to view your automations.' :
            !configured ? 'Deployment addresses are invalid.' :
            owner.isError || (isOwner && (target.isError || authorization.isError)) ? 'Unable to verify the deployment on-chain.' :
            owner.isPending || (isOwner && (target.isPending || authorization.isPending)) ? 'Checking the configured deployment…' :
            'No verified deployment is linked to this wallet.'}
        </p>
      )}
    </div>
  );
}
