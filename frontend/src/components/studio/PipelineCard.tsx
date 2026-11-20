'use client';

import React from 'react';
import { ArrowRight, Layers, Clock, Zap, Shield, Cpu, Activity, Radio } from 'lucide-react';
import { PipelineKebabMenu } from './PipelineKebabMenu';
import type { DeploymentSummary } from '@/lib/deployments';

export interface PipelineItem {
  id: string;
  name: string;
  description?: string;
  updatedAt: number;
  source: 'local' | 'wallet' | 'recipe';
  status?: 'draft' | 'deployed' | 'pending' | 'archived';
  hasDraft?: boolean;
  deployment?: DeploymentSummary;
  nodeCount?: number;
  edgeCount?: number;
  triggerType?: string;
  actionType?: string;
  graph?: unknown;
  isArchived?: boolean;
}

export interface PipelineCardProps {
  pipeline: PipelineItem;
  onOpen: (pipeline: PipelineItem) => void;
  onRename: (pipeline: PipelineItem) => void;
  onDuplicate: (pipeline: PipelineItem) => void;
  onDelete: (pipeline: PipelineItem) => void;
  onExport: (pipeline: PipelineItem) => void;
  onArchive?: (pipeline: PipelineItem) => void;
}

export function PipelineCard({
  pipeline,
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
  onExport,
  onArchive,
}: PipelineCardProps) {
  const isWallet = pipeline.source === 'wallet';
  const isRecipe = pipeline.source === 'recipe';

  const getSourceBadge = () => {
    if (pipeline.hasDraft && pipeline.deployment) {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-teal-500/10 border border-teal-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-teal-300">
          <Radio className="size-2.5 animate-pulse" />
          <span>DRAFT + LIVE V1</span>
        </span>
      );
    }
    if (pipeline.status === 'deployed') {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
          <Radio className="size-2.5 text-emerald-400" />
          <span>LIVE V1</span>
        </span>
      );
    }
    if (isWallet) {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-violet-500/10 border border-violet-500/30 px-1.5 py-0.5 text-[10px] font-medium text-violet-300">
          <Zap className="size-2.5" />
          <span>WALLET</span>
        </span>
      );
    }
    if (isRecipe) {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">
          <Shield className="size-2.5" />
          <span>RECIPE</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded bg-indigo-500/10 border border-indigo-500/30 px-1.5 py-0.5 text-[10px] font-medium text-indigo-300">
        <Cpu className="size-2.5" />
        <span>LOCAL</span>
      </span>
    );
  };

  const getTriggerLabel = () => {
    if (!pipeline.triggerType) return null;
    switch (pipeline.triggerType) {
      case 'watchDEXPrice':
        return 'DEX Price';
      case 'watchTransfers':
        return 'Transfers';
      case 'periodicCron':
        return 'Cron Timer';
      case 'customEventWatcher':
        return 'Event Log';
      default:
        return 'Trigger';
    }
  };

  const triggerLabel = getTriggerLabel();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(pipeline)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(pipeline);
        }
      }}
      className="group relative flex flex-col justify-between rounded-xl border border-[var(--ws-border)] bg-[var(--ws-panel)] p-4 text-left transition-all duration-200 hover:border-[var(--ws-accent)]/70 hover:shadow-lg hover:shadow-[var(--ws-accent-bg)]/20 hover:-translate-y-0.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--ws-accent)] select-none"
    >
      {/* Top row: Badges & Kebab menu */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {getSourceBadge()}
          {triggerLabel && (
            <span className="inline-flex items-center gap-1 rounded bg-white/5 border border-white/10 px-1.5 py-0.5 text-[10px] text-zinc-300 font-mono">
              <Activity className="size-2.5 text-[var(--ws-accent)]" />
              <span>{triggerLabel}</span>
            </span>
          )}
        </div>

        {/* 3-dots kebab menu */}
        <PipelineKebabMenu
          onRename={() => onRename(pipeline)}
          onDuplicate={() => onDuplicate(pipeline)}
          onExport={() => onExport(pipeline)}
          onDelete={() => onDelete(pipeline)}
          onArchive={onArchive ? () => onArchive(pipeline) : undefined}
          isArchived={pipeline.isArchived}
          canDelete={pipeline.source !== 'recipe'}
        />
      </div>

      {/* Middle: Title & Description */}
      <div className="my-3 space-y-1.5">
        <h3
          className="text-sm font-semibold tracking-tight text-white group-hover:text-[var(--ws-accent)] transition-colors truncate"
          title={pipeline.name}
        >
          {pipeline.name}
        </h3>
        <p className="text-xs text-[var(--ws-muted)] leading-relaxed line-clamp-2 min-h-[2.25rem]">
          {pipeline.description ||
            'Cross-chain automated DAG workflow reacting on Base Sepolia and executing actions.'}
        </p>
      </div>

      {/* Bottom row: Metrics & Open Canvas CTA */}
      <div className="flex items-center justify-between border-t border-[var(--ws-border)] pt-3 text-[11px] text-[var(--ws-muted)]">
        <div className="flex items-center gap-2 font-mono tabular-nums">
          {pipeline.nodeCount !== undefined && pipeline.nodeCount > 0 && (
            <span className="flex items-center gap-1">
              <Layers className="size-3 text-zinc-400" />
              <span>{pipeline.nodeCount}N · {pipeline.edgeCount ?? 0}W</span>
            </span>
          )}
          {pipeline.updatedAt > 0 && (
            <>
              {pipeline.nodeCount !== undefined && pipeline.nodeCount > 0 && <span>·</span>}
              <span className="flex items-center gap-1" title={new Date(pipeline.updatedAt).toLocaleString()}>
                <Clock className="size-3 text-zinc-500" />
                <span>
                  {new Date(pipeline.updatedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </span>
            </>
          )}
        </div>

        <span className="inline-flex items-center gap-1 font-semibold text-xs text-[var(--ws-accent)] group-hover:translate-x-0.5 transition-transform">
          <span>{pipeline.hasDraft ? 'Open Draft' : pipeline.status === 'deployed' ? 'View Snapshot' : 'Open Canvas'}</span>
          <ArrowRight className="size-3" />
        </span>
      </div>
    </div>
  );
}
