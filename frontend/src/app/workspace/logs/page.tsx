'use client';

import { WorkspacePageHeader, WorkspaceState } from '@/components/common/WorkspaceUI';
import { useAccount } from 'wagmi';

export default function ActivityLogsPage() {
  const { isConnected } = useAccount();

  return (
    <div className="ws-page">
      <WorkspacePageHeader title="Activity Logs" description="Origin events, Reactive requests and destination receipts." />
      <WorkspaceState title={isConnected ? 'Activity history for this wallet is not available yet.' : 'Connect a wallet to view your activity.'}
        action={{ label: 'View public testnet proof', href: '/#proof' }} />
    </div>
  );
}
