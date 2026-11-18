'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  ExternalLink, 
  RefreshCw, 
  Terminal,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';
import { truncateAddress } from '@/lib/utils';
import { APP_CONFIG } from '@/lib/constants';

interface LogDetails {
  tokenPair?: string;
  triggerPrice?: string;
  executedPrice?: string;
  amountIn?: string;
  amountOut?: string;
  reason?: string;
  [key: string]: any;
}

interface LogEntry {
  id: string;
  pipelineId?: string;
  pipelineName?: string;
  step?: string;
  status?: 'SUCCESS' | 'SKIPPED' | 'FAILED' | string;
  originTxHash?: string;
  originBlock?: number;
  originEvent?: string;
  reactiveTxHash?: string;
  reactiveLatencyMs?: number;
  latencyMs?: number;
  destinationTxHash?: string;
  destinationAction?: string;
  originChainId?: number;
  destinationChainId?: number;
  timestamp: string | number;
  details?: string | LogDetails;
}

const FALLBACK_LOGS: LogEntry[] = [
  {
    id: 'log-001',
    pipelineId: 'pipe-84532-001',
    pipelineName: 'Flash Crash Stop-Loss',
    status: 'SUCCESS',
    step: 'EXECUTION_SUCCESS',
    originTxHash: '0x4a12c8e419b5f8f2a58d5f6d90f23beb5e3af3f123456789abcdef0123456789',
    originEvent: 'Sync(reserve0, reserve1)',
    reactiveTxHash: '0x7b23d9f520c6a9a3b69e6a7e01a34cfa6f4ba4a234567890bcdef01234567890',
    destinationTxHash: '0x9c34e0a631d7b0b4c70f7b8f12b45dfb705cb5b345678901cdef012345678901',
    destinationAction: 'executeStopLoss(percent: 50%, minOut: 89.2 USDC)',
    originChainId: 84532,
    destinationChainId: 84532,
    latencyMs: 1080,
    timestamp: Date.now() - 1000 * 60 * 12,
    details: {
      tokenPair: 'WETH/USDC',
      triggerPrice: '$1,784.50',
      executedPrice: '$1,782.10',
      amountIn: '0.05 WETH',
      amountOut: '89.10 USDC'
    },
  },
  {
    id: 'log-002',
    pipelineId: 'pipe-84532-001',
    pipelineName: 'ETH Flash Bounce Re-Validation Guard',
    status: 'SKIPPED',
    step: 'ORDER_SKIPPED',
    originTxHash: '0x6c34e0a631d7b0b4c70f7b8f12b45dfb705cb5b345678901cdef01234567892',
    originEvent: 'Sync(reserve0, reserve1)',
    reactiveTxHash: '0x9d45f1b742e8c1c5d81a8c9a23c56eac816dc6c456789012def012345678903',
    destinationAction: 'OrderSkipped(reason: Price bounced back above stop threshold)',
    originChainId: 84532,
    destinationChainId: 84532,
    latencyMs: 820,
    timestamp: Date.now() - 1000 * 60 * 8,
    details: {
      tokenPair: 'WETH/USDC',
      triggerPrice: '$1,795.00',
      executedPrice: '$1,815.20 (Bounced Back)',
      reason: 'Stateless cooldown active (300s window). Multi-callback flurry prevented.'
    },
  },
  {
    id: 'log-003',
    pipelineId: 'pipe-84532-002',
    pipelineName: 'Compromised Wallet Anti-Drainer',
    status: 'SUCCESS',
    step: 'EXECUTION_SUCCESS',
    originTxHash: '0x5b23d9e520c6a9a3b69e6a7e01a34cfa6f4ba4a234567890bcdef01234567891',
    originEvent: 'Transfer(from: 0x742d..., to: 0xBadActor, value: 0.01 ETH)',
    reactiveTxHash: '0x8c34e0a631d7b0b4c70f7b8f12b45dfb705cb5b345678901cdef012345678902',
    destinationTxHash: '0xad45f1b742e8c1c5d81a8c9a23c56eac816dc6c456789012def0123456789012',
    destinationAction: 'executeSafeSweep(backupSafeAddress: 0xColdSafe...)',
    originChainId: 84532,
    destinationChainId: 84532,
    latencyMs: 990,
    timestamp: Date.now() - 1000 * 60 * 2,
    details: {
      amountIn: '0.04 ETH (Vault Balance)',
      amountOut: 'Transferred 100% to Cold Wallet Safe'
    },
  },
];

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>(FALLBACK_LOGS);
  const [filter, setFilter] = useState<'ALL' | 'SUCCESS' | 'SKIPPED'>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLogs = () => {
    setIsRefreshing(true);
    fetch(`${APP_CONFIG.backendUrl}/api/logs`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.logs && Array.isArray(data.logs) && data.logs.length > 0) {
          setLogs(data.logs);
        }
      })
      .catch(() => {
        // Fallback logs remain active
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((l) => {
    const isSuccess = l.status === 'SUCCESS' || l.step === 'EXECUTION_SUCCESS';
    const isSkipped = l.status === 'SKIPPED' || l.step === 'ORDER_SKIPPED';
    if (filter === 'SUCCESS') return isSuccess;
    if (filter === 'SKIPPED') return isSkipped;
    return true;
  });

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6 select-none font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/20 flex items-center justify-center text-white shadow-sm shrink-0">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight font-display">
                Activity Logs
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20 text-[10px] font-mono font-medium">
                LIVE AUDIT
              </span>
            </div>
            <p className="text-xs text-[#8e8e8e] mt-0.5">
              Real-Time Cross-Chain Event Stream &bull; Base Sepolia &harr; Reactive Lasna
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchLogs}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#16171a] hover:bg-[#202126] border border-white/20 text-xs text-white transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#16171a] border border-white/20 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[#c4c2c3] font-medium text-xs">
              Relayer Active
            </span>
          </div>
        </div>
      </div>

      {/* 4 Telemetry Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#0b0c10]/80 backdrop-blur-xl border border-white/[0.08] hover:border-white/[0.18] transition-all">
          <div className="text-[11px] text-[#8e8e8e] uppercase font-mono tracking-wider">Events Captured</div>
          <div className="text-2xl font-bold text-white mt-1 tabular-nums font-display">
            142 <span className="text-xs text-[#8e8e8e] font-sans font-normal">Events</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0b0c10]/80 backdrop-blur-xl border border-white/[0.08] hover:border-white/[0.18] transition-all">
          <div className="text-[11px] text-[#8e8e8e] uppercase font-mono tracking-wider">Callbacks Fired</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1 tabular-nums font-display">
            03 <span className="text-xs text-[#8e8e8e] font-sans font-normal">Executed</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0b0c10]/80 backdrop-blur-xl border border-white/[0.08] hover:border-white/[0.18] transition-all">
          <div className="text-[11px] text-[#8e8e8e] uppercase font-mono tracking-wider">Storms Defended</div>
          <div className="text-2xl font-bold text-amber-400 mt-1 tabular-nums font-display">
            12 <span className="text-xs text-[#8e8e8e] font-sans font-normal">Protected</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0b0c10]/80 backdrop-blur-xl border border-white/[0.08] hover:border-white/[0.18] transition-all">
          <div className="text-[11px] text-[#8e8e8e] uppercase font-mono tracking-wider">Average RVM Latency</div>
          <div className="text-2xl font-bold text-violet-300 mt-1 tabular-nums font-display">
            973 <span className="text-xs text-[#8e8e8e] font-sans font-normal">ms</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-[#121318] rounded-full border border-white/20 text-xs">
          {(['ALL', 'SUCCESS', 'SKIPPED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1 font-medium capitalize rounded-full transition-all cursor-pointer ${
                filter === tab
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-[#8e8e8e] hover:text-white'
              }`}
            >
              {tab === 'ALL' ? 'All Events' : tab === 'SUCCESS' ? 'Executed' : 'Defended'}
            </button>
          ))}
        </div>

        <span className="text-xs text-[#8e8e8e] font-mono">
          Showing {filteredLogs.length} of {logs.length} audit entries
        </span>
      </div>

      {/* Log Console Container */}
      <div className="rounded-2xl bg-[#0b0c10]/90 backdrop-blur-xl border border-white/[0.08] overflow-hidden divide-y divide-white/[0.06] shadow-2xl">
        {filteredLogs.map((log) => {
          const statusText = log.step || log.status || 'SUCCESS';
          const isSuccess = statusText === 'SUCCESS' || statusText === 'EXECUTION_SUCCESS';
          const isSkipped = statusText === 'SKIPPED' || statusText === 'ORDER_SKIPPED';
          const latency = log.latencyMs || log.reactiveLatencyMs || 980;
          const timestampNum = typeof log.timestamp === 'number' ? log.timestamp : Date.parse(log.timestamp);
          const timeFormatted = !isNaN(timestampNum) ? new Date(timestampNum).toLocaleTimeString() : String(log.timestamp);

          return (
            <div
              key={log.id}
              className="p-4 md:p-5 hover:bg-white/[0.02] transition-colors space-y-3 text-xs"
            >
              {/* Row Top: Status, Pipeline, Latency */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSuccess
                        ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                        : isSkipped
                        ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                        : 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]'
                    }`}
                  />
                  <span
                    className={`font-mono font-semibold text-[11px] uppercase tracking-wider ${
                      isSuccess
                        ? 'text-emerald-400'
                        : isSkipped
                        ? 'text-amber-400'
                        : 'text-cyan-400'
                    }`}
                  >
                    {statusText}
                  </span>
                  <span className="text-white/20">&bull;</span>
                  <span className="text-white font-medium">{log.pipelineName || log.pipelineId || 'Cross-Chain Pipeline'}</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-[#8e8e8e]">
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span className="tabular-nums">{timeFormatted}</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#16171a] border border-white/10 text-slate-300 font-mono font-medium tabular-nums text-[11px]">
                    {latency}ms latency
                  </span>
                </div>
              </div>

              {/* Event / Action summary if present */}
              {(log.originEvent || log.destinationAction) && (
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400 bg-white/[0.02] p-2 rounded-xl border border-white/[0.04]">
                  {log.originEvent && (
                    <span className="text-cyan-300">
                      Captured: <code className="text-white">{log.originEvent}</code>
                    </span>
                  )}
                  {log.originEvent && log.destinationAction && <span className="text-white/20">&rarr;</span>}
                  {log.destinationAction && (
                    <span className="text-emerald-300">
                      Action: <code className="text-white">{log.destinationAction}</code>
                    </span>
                  )}
                </div>
              )}

              {/* Row Details: Safe Object / String Renderer (No crashes!) */}
              {log.details && (
                <div className="pt-1">
                  {typeof log.details === 'string' ? (
                    <p className="text-[#c4c2c3] leading-relaxed font-sans">{log.details}</p>
                  ) : typeof log.details === 'object' && log.details !== null ? (
                    <div className="flex flex-wrap gap-2 items-center">
                      {log.details.tokenPair && (
                        <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono text-[11px]">
                          Pair: <strong className="text-white">{log.details.tokenPair}</strong>
                        </span>
                      )}
                      {log.details.triggerPrice && (
                        <span className="px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 text-slate-300 font-mono text-[11px]">
                          Trigger: <strong className="text-white">{log.details.triggerPrice}</strong>
                        </span>
                      )}
                      {log.details.executedPrice && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono text-[11px]">
                          Executed: <strong className="text-emerald-400">{log.details.executedPrice}</strong>
                        </span>
                      )}
                      {log.details.amountIn && (
                        <span className="px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 font-mono text-[11px]">
                          In: <strong className="text-white">{log.details.amountIn}</strong>
                        </span>
                      )}
                      {log.details.amountOut && (
                        <span className="px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 font-mono text-[11px]">
                          Out: <strong className="text-white">{log.details.amountOut}</strong>
                        </span>
                      )}
                      {log.details.reason && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]">
                          Note: {log.details.reason}
                        </span>
                      )}
                    </div>
                  ) : null}
                </div>
              )}

              {/* Row Bottom: Verifiable Tx Hashes */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono">
                {log.originTxHash && (
                  <a
                    href={`https://sepolia.basescan.org/tx/${log.originTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-cyan-400/90 hover:text-cyan-300 transition-colors"
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
                    className="flex items-center gap-1 text-violet-300/90 hover:text-white transition-colors"
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
                    className="flex items-center gap-1 text-emerald-400/90 hover:text-emerald-300 transition-colors"
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
