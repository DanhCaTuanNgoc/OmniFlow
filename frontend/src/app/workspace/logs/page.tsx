'use client';

import React from 'react';
import { FileText, Radio, ExternalLink } from 'lucide-react';

export default function ActivityLogsPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Activity Logs & Cross-Chain Stream
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time event stream from Base Sepolia & Reactive Lasna Testnets.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400">
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          WebSocket Stream Active
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
        <p className="text-sm text-slate-300">
          Live on-chain event loop logs will stream here as contracts emit events.
        </p>
      </div>
    </div>
  );
}
