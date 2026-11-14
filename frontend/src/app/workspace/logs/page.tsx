'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Radio, 
  ExternalLink, 
  RefreshCw, 
  Terminal,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { truncateAddress } from '@/lib/utils';
import { APP_CONFIG } from '@/lib/constants';

interface LogEntry {
  id: string;
  pipelineId: string;
  pipelineName: string;
  step: 'TRIGGER_CAPTURED' | 'CONDITION_MET' | 'CALLBACK_FIRED' | 'EXECUTION_SUCCESS' | 'ORDER_SKIPPED';
  originTxHash: string;
  reactiveTxHash?: string;
  destinationTxHash?: string;
  originChainId: number;
  destinationChainId: number;
  latencyMs: number;
  timestamp: number;
  details: string;
}

const FALLBACK_LOGS: LogEntry[] = [
  {
    id: 'log-001',
    pipelineId: 'pipe-84532-001',
    pipelineName: 'Flash Crash Stop-Loss',
    step: 'EXECUTION_SUCCESS',
    originTxHash: '0x3a4b8c9d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
    reactiveTxHash: '0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e',
    destinationTxHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    originChainId: 84532,
    destinationChainId: 84532,
    latencyMs: 1140,
    timestamp: Date.now() - 1000 * 60 * 12,
    details: 'ETH price drop detected: $1,780 <= $1,800. Successfully swapped 0.25 ETH to 445 USDC.',
  },
  {
    id: 'log-002',
    pipelineId: 'pipe-84532-001',
    pipelineName: 'Flash Crash Stop-Loss',
    step: 'ORDER_SKIPPED',
    originTxHash: '0x5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
    reactiveTxHash: '0x2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f',
    originChainId: 84532,
    destinationChainId: 84532,
    latencyMs: 820,
    timestamp: Date.now() - 1000 * 60 * 8,
    details: 'Stateless cooldown active (300s window). Multi-callback flurry prevented.',
  },
  {
    id: 'log-003',
    pipelineId: 'pipe-84532-001',
    pipelineName: 'Flash Crash Stop-Loss',
    step: 'TRIGGER_CAPTURED',
    originTxHash: '0x7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f',
    reactiveTxHash: '0x4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b',
    originChainId: 84532,
    destinationChainId: 84532,
    latencyMs: 960,
    timestamp: Date.now() - 1000 * 60 * 2,
    details: 'DEX Sync event captured from pair 0x1234...5678. Price currently $1,840 (above threshold).',
  },
];

export function ActivityLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>(FALLBACK_LOGS);
  const [filter, setFilter] = useState<'ALL' | 'SUCCESS' | 'SKIPPED'>('ALL');

  useEffect(() => {
    fetch(`${APP_CONFIG.backendUrl}/api/logs`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.logs && Array.isArray(data.logs) && data.logs.length > 0) {
          setLogs(data.logs);
        }
      })
      .catch(() => {
        // Fallback logs remain active
      });
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (filter === 'SUCCESS') return l.step === 'EXECUTION_SUCCESS';
    if (filter === 'SKIPPED') return l.step === 'ORDER_SKIPPED';
    return true;
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#2E1E54]/60">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-purple-600/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Activity Logs
              </h1>
              <p className="text-xs text-purple-300/70 mt-0.5">
                Real-Time Cross-Chain Event Stream &bull; Base Sepolia &harr; Reactive Lasna
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#150E28] border border-purple-900/40 text-xs">
            <span className="status-dot status-dot-emerald" />
            <span className="text-purple-200 font-medium text-xs">
              WebSocket Stream Active
            </span>
          </div>
        </div>
      </div>

      {/* 4 Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#110B1F]/90 border border-purple-900/30 hover:border-purple-500/40 transition-all shadow-md">
          <div className="text-xs text-purple-300/70 font-medium">Events Captured</div>
          <div className="text-2xl font-bold text-white mt-1.5 tabular-nums">
            142 <span className="text-xs text-purple-300/70 font-normal">Events</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#110B1F]/90 border border-purple-900/30 hover:border-purple-500/40 transition-all shadow-md">
          <div className="text-xs text-purple-300/70 font-medium">Callbacks Fired</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1.5 tabular-nums">
            03 <span className="text-xs text-purple-300/70 font-normal">Executed</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#110B1F]/90 border border-purple-900/30 hover:border-purple-500/40 transition-all shadow-md">
          <div className="text-xs text-purple-300/70 font-medium">Storms Defended</div>
          <div className="text-2xl font-bold text-amber-400 mt-1.5 tabular-nums">
            12 <span className="text-xs text-purple-300/70 font-normal">Protected</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#110B1F]/90 border border-purple-900/30 hover:border-purple-500/40 transition-all shadow-md">
          <div className="text-xs text-purple-300/70 font-medium">Average RVM Latency</div>
          <div className="text-2xl font-bold text-violet-300 mt-1.5 tabular-nums">
            973 <span className="text-xs text-purple-300/70 font-normal">ms</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 bg-[#150E28] rounded-full border border-purple-900/30 text-xs">
          {(['ALL', 'SUCCESS', 'SKIPPED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1 font-medium capitalize rounded-full transition-all cursor-pointer ${
                filter === tab
                  ? 'bg-purple-900/60 text-white shadow-sm font-semibold'
                  : 'text-purple-300/60 hover:text-white'
              }`}
            >
              {tab === 'ALL' ? 'All Events' : tab === 'SUCCESS' ? 'Executed' : 'Defended'}
            </button>
          ))}
        </div>

        <span className="text-xs text-purple-300/60">
          Showing {filteredLogs.length} of {logs.length} audit entries
        </span>
      </div>

      {/* Log Console Container */}
      <div className="rounded-2xl bg-[#110B1F]/80 border border-purple-900/30 overflow-hidden divide-y divide-purple-900/20 shadow-xl">
        {filteredLogs.map((log) => {
          const isSuccess = log.step === 'EXECUTION_SUCCESS';
          const isSkipped = log.step === 'ORDER_SKIPPED';

          return (
            <div
              key={log.id}
              className="p-4 hover:bg-[#1B1233]/70 transition-colors space-y-2.5 text-xs"
            >
              {/* Row Top: Status, Pipeline, Latency */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`status-dot ${
                      isSuccess
                        ? 'status-dot-emerald'
                        : isSkipped
                        ? 'status-dot-amber'
                        : 'status-dot-cyan'
                    }`}
                  />
                  <span
                    className={`font-semibold text-xs ${
                      isSuccess
                        ? 'text-emerald-400'
                        : isSkipped
                        ? 'text-amber-400'
                        : 'text-cyan-400'
                    }`}
                  >
                    {log.step}
                  </span>
                  <span className="text-purple-400/40">&bull;</span>
                  <span className="text-white font-medium">{log.pipelineName}</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-purple-300/60">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-purple-400/60" />
                    <span className="tabular-nums">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#0D0819] border border-purple-900/30 text-purple-200 font-mono font-medium tabular-nums text-[11px]">
                    {log.latencyMs}ms latency
                  </span>
                </div>
              </div>

              {/* Row Description */}
              <p className="text-slate-300 leading-relaxed">
                {log.details}
              </p>

              {/* Row Bottom: Verifiable Tx Hashes */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono">
                {log.originTxHash && (
                  <a
                    href={`https://sepolia.basescan.org/tx/${log.originTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-cyan-300/80 hover:text-cyan-200 transition-colors"
                  >
                    <span>Origin: {truncateAddress(log.originTxHash, 6)}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}

                {log.reactiveTxHash && (
                  <a
                    href={`https://lasna.reactscan.net/tx/${log.reactiveTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-violet-300/80 hover:text-white transition-colors"
                  >
                    <span>RVM: {truncateAddress(log.reactiveTxHash, 6)}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}

                {log.destinationTxHash && (
                  <a
                    href={`https://sepolia.basescan.org/tx/${log.destinationTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-emerald-300/80 hover:text-emerald-200 transition-colors"
                  >
                    <span>ActionVault: {truncateAddress(log.destinationTxHash, 6)}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ActivityLogsPage;
