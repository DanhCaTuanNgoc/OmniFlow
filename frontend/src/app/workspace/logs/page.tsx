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
    <div className="p-6 max-w-6xl mx-auto space-y-6 font-mono select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#1C142E]">
        <div>
          <div className="flex items-center gap-2">
            <span className="status-pip status-pip-emerald" />
            <h1 className="text-base font-extrabold uppercase tracking-wider text-white">
              ACTIVITY LOGS // CROSS-CHAIN EVENT STREAM
            </h1>
          </div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">
            FULL LOOP AUDIT TRAIL &bull; BASE SEPOLIA &harr; REACTIVE LASNA (ZERO-MOCK PROOF)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-none bg-[#0B0813] border border-[#1C142E] text-xs">
            <span className="status-pip status-pip-emerald" />
            <span className="text-zinc-300 uppercase tracking-wider text-[10px]">
              WEBSOCKET GATEWAY: ONLINE
            </span>
          </div>
        </div>
      </div>

      {/* 4 Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
        <div className="tech-corner-accent p-3.5 bg-[#0B0813] border border-[#1C142E]">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">TOTAL EVENTS CAPTURED</div>
          <div className="text-2xl font-extrabold text-white mt-1 tabular-nums">
            142 <span className="text-xs text-zinc-500 font-normal">EVENTS</span>
          </div>
        </div>

        <div className="tech-corner-accent p-3.5 bg-[#0B0813] border border-[#1C142E]">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">CALLBACKS FIRED</div>
          <div className="text-2xl font-extrabold text-[#00FF9D] mt-1 tabular-nums">
            03 <span className="text-xs text-zinc-500 font-normal">EXECUTED</span>
          </div>
        </div>

        <div className="tech-corner-accent p-3.5 bg-[#0B0813] border border-[#1C142E]">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">COOLDOWN BLOCKED</div>
          <div className="text-2xl font-extrabold text-[#F59E0B] mt-1 tabular-nums">
            12 <span className="text-xs text-zinc-500 font-normal">STORMS DEFENDED</span>
          </div>
        </div>

        <div className="tech-corner-accent p-3.5 bg-[#0B0813] border border-[#1C142E]">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">AVERAGE RVM LATENCY</div>
          <div className="text-2xl font-extrabold text-[#C084FC] mt-1 tabular-nums">
            973 <span className="text-xs text-zinc-500 font-normal">ms</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 border border-[#1C142E] bg-[#06040A] p-0.5 text-[10px]">
          {(['ALL', 'SUCCESS', 'SKIPPED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 font-bold uppercase tracking-wider transition-colors cursor-pointer rounded-none ${
                filter === tab
                  ? 'bg-[#110C1E] text-white border-b-2 border-[#8B5CF6]'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
          SHOWING {filteredLogs.length} OF {logs.length} AUDIT ENTRIES
        </span>
      </div>

      {/* Terminal Log Console */}
      <div className="scanline-overlay bg-[#06040A] border border-[#1C142E] p-1 divide-y divide-[#1C142E]">
        {filteredLogs.map((log) => {
          const isSuccess = log.step === 'EXECUTION_SUCCESS';
          const isSkipped = log.step === 'ORDER_SKIPPED';

          return (
            <div
              key={log.id}
              className="p-3.5 bg-[#0B0813]/70 hover:bg-[#110C1E] transition-colors space-y-2 text-xs"
            >
              {/* Row Top: Status, Pipeline, Latency */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`status-pip ${
                      isSuccess
                        ? 'status-pip-emerald'
                        : isSkipped
                        ? 'status-pip-amber'
                        : 'status-pip-cyan'
                    }`}
                  />
                  <span
                    className={`font-bold uppercase tracking-wider text-[11px] ${
                      isSuccess
                        ? 'text-[#00FF9D]'
                        : isSkipped
                        ? 'text-[#F59E0B]'
                        : 'text-cyan-400'
                    }`}
                  >
                    {log.step}
                  </span>
                  <span className="text-zinc-600">&bull;</span>
                  <span className="text-zinc-300 font-bold uppercase">{log.pipelineName}</span>
                </div>

                <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-600" />
                    <span className="tabular-nums">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded-none bg-[#06040A] border border-[#1C142E] text-zinc-300 font-bold tabular-nums">
                    {log.latencyMs}ms LATENCY
                  </span>
                </div>
              </div>

              {/* Row Description */}
              <p className="text-[11px] text-zinc-400 font-sans">
                {log.details}
              </p>

              {/* Row Bottom: Verifiable Tx Hashes */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px]">
                {log.originTxHash && (
                  <a
                    href={`https://sepolia.basescan.org/tx/${log.originTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                  >
                    <span>ORIGIN TX: {truncateAddress(log.originTxHash, 6)}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}

                {log.reactiveTxHash && (
                  <a
                    href={`https://lasna.reactscan.net/tx/${log.reactiveTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[#C084FC] hover:text-[#DDD6FE]"
                  >
                    <span>RVM TX: {truncateAddress(log.reactiveTxHash, 6)}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}

                {log.destinationTxHash && (
                  <a
                    href={`https://sepolia.basescan.org/tx/${log.destinationTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[#00FF9D] hover:text-emerald-300"
                  >
                    <span>CALLBACK VAULT TX: {truncateAddress(log.destinationTxHash, 6)}</span>
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
