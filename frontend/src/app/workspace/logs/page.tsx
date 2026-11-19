'use client';

import { Activity } from 'lucide-react';
import { useAccount } from 'wagmi';

export default function ActivityLogsPage() {
  const { isConnected } = useAccount();

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <header className="flex items-center gap-3 pb-4 border-b border-white/10">
        <Activity aria-hidden="true" className="w-5 h-5 text-slate-300" />
        <h1 className="text-xl font-bold text-white font-display">Activity Logs</h1>
      </header>
      <p role="status" className="text-sm text-slate-300">
        {isConnected ? 'Activity history for this wallet is not available yet.' : 'Connect a wallet to view your activity.'}
      </p>
    </div>
  );
}
