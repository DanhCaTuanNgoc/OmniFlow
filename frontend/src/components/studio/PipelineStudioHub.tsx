'use client';

import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import type { Address } from 'viem';
import { 
  Plus, 
  Search, 
  Upload, 
  Library, 
  Layers, 
  AlertCircle,
  Network,
  Loader2,
  CheckCircle2,
  Archive,
  Zap,
  Activity
} from 'lucide-react';
import { 
  listBrowserDrafts, 
  saveBrowserDraft, 
  deleteBrowserDraft, 
  renameBrowserDraft, 
  duplicateBrowserDraft, 
  exportDraftJson, 
  extractPipelineStats,
  parsePipelineDraft,
  archiveBrowserDraft,
  studioGraph,
  type BrowserDraft 
} from '@/lib/pipelineDraft';
import { STOP_LOSS_TEMPLATE } from '@omniflow/shared';
import type { DeploymentSummary } from '@/lib/deployments';
import { WorkspaceSignInRequired, WorkspaceWalletPromptCancelled, workspaceRequest } from '@/lib/workspaceSession';
import { RECIPE_PRESETS } from '@/lib/recipes';
import { PALETTE_ITEMS } from '@/components/canvas/NodePalette';

import { PipelineCard, type PipelineItem } from './PipelineCard';
import { RenamePipelineModal } from './RenamePipelineModal';
import { DeletePipelineModal } from './DeletePipelineModal';
import { NewPipelineModal } from './NewPipelineModal';
import { useWorkspaceSignedIn } from '@/components/common/WorkspaceSignIn';

const draftNodeTypes = new Map(PALETTE_ITEMS.map((item) => [item.type, item.category]));

type WalletDraftSummary = { id: string; name: string; updatedAt: number };

export function PipelineStudioHub() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  // Local drafts state
  const [localDrafts, setLocalDrafts] = useState<BrowserDraft[]>([]);
  const [localError, setLocalError] = useState(false);

  // Wallet drafts & deployments state
  const [walletDrafts, setWalletDrafts] = useState<WalletDraftSummary[]>([]);
  const [walletDeployments, setWalletDeployments] = useState<DeploymentSummary[]>([]);
  const [walletPending, setWalletPending] = useState(Boolean(isConnected && address));
  const [walletError, setWalletError] = useState<string>();
  const [signInRequired, setSignInRequired] = useState(false);
  const signedIn = useWorkspaceSignedIn(isConnected ? address : undefined);
  const [reload, setReload] = useState(0);
  const session = useRef<AbortController>();
  const actionInFlight = useRef(false);
  useLayoutEffect(() => {
    const controller = new AbortController();
    session.current = controller;
    return () => controller.abort();
  }, []);

  // Filter & Search (Aligned with Section 7.2 of Operations Analysis: All, Drafts, Active, Archived)
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFTS' | 'ACTIVE' | 'ARCHIVED'>('ALL');

  // Guest draft migration state
  const [isImportingGuest, setIsImportingGuest] = useState(false);
  const [dismissedGuestBanner, setDismissedGuestBanner] = useState(false);
  const [guestImportMessage, setGuestImportMessage] = useState<string | null>(null);

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [renamingPipeline, setRenamingPipeline] = useState<PipelineItem | null>(null);
  const [deletingPipeline, setDeletingPipeline] = useState<PipelineItem | null>(null);

  // Hidden File input for import
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // 1. Load Local Browser Drafts
  const refreshLocalDrafts = () => {
    try {
      setLocalDrafts(listBrowserDrafts());
      setLocalError(false);
    } catch {
      setLocalError(true);
    }
  };

  useEffect(() => {
    refreshLocalDrafts();
  }, []);

  // 2. Load Wallet Drafts & Deployments when connected
  useEffect(() => {
    if (!isConnected || !address) {
      setWalletDrafts([]);
      setWalletDeployments([]);
      return;
    }

    const request = new AbortController();
    async function fetchWalletData(owner: Address) {
      setWalletPending(true);
      setWalletError(undefined);
      try {
        const [draftsRes, depsRes] = await Promise.allSettled([
          workspaceRequest<{ drafts: WalletDraftSummary[] }>(owner, '/pipeline/drafts', { signal: request.signal, sessionOnly: true }),
          workspaceRequest<{ deployments: DeploymentSummary[] }>(owner, '/pipeline/deployments', { signal: request.signal, sessionOnly: true }),
        ]);

        if (!request.signal.aborted) {
          const needsSignIn = [draftsRes, depsRes].some(result =>
            result.status === 'rejected' && result.reason instanceof WorkspaceSignInRequired);
          setSignInRequired(needsSignIn);
          if (needsSignIn) {
            setWalletDrafts([]);
            setWalletDeployments([]);
            return;
          }
          const failures = [draftsRes.status === 'rejected' && 'drafts', depsRes.status === 'rejected' && 'deployments'].filter(Boolean);
          if (failures.length) setWalletError('Could not load wallet ' + failures.join(' and ') + '.');
          if (draftsRes.status === 'fulfilled') {
            setWalletDrafts(draftsRes.value.drafts || []);
          }
          if (depsRes.status === 'fulfilled') {
            setWalletDeployments(depsRes.value.deployments || []);
          }
        }
      } catch (err) {
        if (!request.signal.aborted) {
          setWalletError(err instanceof Error ? err.message : 'Unable to load wallet data.');
        }
      } finally {
        if (!request.signal.aborted) {
          setWalletPending(false);
        }
      }
    }

    fetchWalletData(address);
    return () => {
      request.abort();
    };
  }, [isConnected, address, reload, signedIn]);

  // Track wallet-archived pipeline IDs in localStorage
  const [walletArchivedIds, setWalletArchivedIds] = useState<string[]>([]);

  useEffect(() => {
    if (address && typeof window !== 'undefined') {
      const stored = localStorage.getItem(`omniflow.archived.pipelines.${address.toLowerCase()}`);
      if (stored) {
        try {
          setWalletArchivedIds(JSON.parse(stored));
        } catch {
          setWalletArchivedIds([]);
        }
      } else {
        setWalletArchivedIds([]);
      }
    }
  }, [address]);

  // Handle Guest-to-Wallet Drafts Import (Section 1 & 7.2)
  const handleImportAllGuestDrafts = async () => {
    if (!address || localDrafts.length === 0) return;
    const signal = session.current?.signal;
    setIsImportingGuest(true);
    let importedCount = 0;
    try {
      // Import sequentially, removing each from localStorage upon success to prevent duplicate imports on partial failure
      for (const draft of [...localDrafts]) {
        const parsed = parsePipelineDraft(JSON.stringify(draft.graph), draftNodeTypes);
        const payload = {
          graph: {
            ...studioGraph(parsed.nodes, parsed.edges, parsed.networks ?? STOP_LOSS_TEMPLATE.networks),
            metadata: { name: draft.name, ownerAddress: address },
          },
        };
        await workspaceRequest(address, '/pipeline/drafts', {
          method: 'POST',
          signal,
          body: JSON.stringify(payload),
        });
        if (signal?.aborted) return;
        deleteBrowserDraft(draft.id);
        importedCount++;
      }
      refreshLocalDrafts();
      setGuestImportMessage(`Successfully imported ${importedCount} browser drafts to your wallet workspace.`);
      setTimeout(() => setGuestImportMessage(null), 5000);
      setDismissedGuestBanner(true);
      setReload(value => value + 1);
    } catch (err) {
      if (signal?.aborted) return;
      setReload(value => value + 1);
      refreshLocalDrafts();
      if (err instanceof WorkspaceWalletPromptCancelled) return;
      setImportError(
        err instanceof Error
          ? `${err.message} (${importedCount} drafts imported before error).`
          : 'Failed to import drafts to wallet.'
      );
      setTimeout(() => setImportError(null), 6000);
    } finally {
      setIsImportingGuest(false);
    }
  };

  // Combine into unified PipelineItem list with status (Section 7.2: Single row for pipeline with draft & deployment)
  const unifiedPipelines = useMemo<PipelineItem[]>(() => {
    const items: PipelineItem[] = [];

    // Local drafts
    for (const draft of localDrafts) {
      const stats = extractPipelineStats(draft.graph);
      items.push({
        id: draft.id,
        name: draft.name,
        description: draft.description,
        updatedAt: draft.updatedAt,
        source: 'local',
        status: draft.isArchived ? 'archived' : 'draft',
        isArchived: Boolean(draft.isArchived),
        nodeCount: stats.nodeCount,
        edgeCount: stats.edgeCount,
        triggerType: stats.triggerType,
        actionType: stats.actionType,
        graph: draft.graph,
      });
    }

    // Wallet drafts & deployments (grouped by workspacePipelineId per Section 7.2)
    const displayedDeployments = new Map<string, DeploymentSummary>();
    for (const dep of walletDeployments) {
      const id = dep.workspacePipelineId ?? dep.pipelineId;
      const previous = displayedDeployments.get(id);
      if (previous) {
        // Prefer a confirmed deployment over a later attempt that is pending or reverted.
        if (previous.status === 'deployed' && dep.status !== 'deployed') continue;
        if ((previous.status === 'deployed') === (dep.status === 'deployed') &&
            (dep.createdAt < previous.createdAt ||
              (dep.createdAt === previous.createdAt && dep.pipelineId <= previous.pipelineId))) continue;
      }
      displayedDeployments.set(id, dep);
    }
    const processed = new Set<string>();

    for (const wDraft of walletDrafts) {
      const matchingDep = displayedDeployments.get(wDraft.id);
      if (matchingDep) processed.add(wDraft.id);

      const isArchived = walletArchivedIds.includes(wDraft.id);
      const status: PipelineItem['status'] = matchingDep
        ? matchingDep.isPaused
          ? 'paused'
          : matchingDep.status === 'deployed'
          ? 'deployed'
          : matchingDep.status === 'signed'
          ? 'pending'
          : 'failed'
        : 'draft';

      items.push({
        id: wDraft.id,
        name: wDraft.name,
        description: matchingDep ? 'Deployment snapshot. Open the saved draft from the menu.' : undefined,
        updatedAt: wDraft.updatedAt,
        source: 'wallet',
        hasDraft: true,
        deployment: matchingDep,
        status,
        isArchived,
      });
    }

    // Standalone deployments that don't have a separate draft revision
    for (const [id, dep] of displayedDeployments) {
      if (processed.has(id)) continue;
      const isArchived = walletArchivedIds.includes(id) || walletArchivedIds.includes(dep.pipelineId);
      items.push({
        id,
        name: dep.name,
        description: dep.contracts.rscAddress
          ? `Reactive contract ${dep.contracts.rscAddress.slice(0, 10)}… on Lasna.`
          : 'Deployment snapshot on Reactive Lasna.',
        updatedAt: dep.createdAt,
        source: 'wallet',
        hasDraft: false,
        deployment: dep,
        status: dep.isPaused ? 'paused' : dep.status === 'deployed' ? 'deployed' : dep.status === 'signed' ? 'pending' : 'failed',
        isArchived,
      });
    }

    return items.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [localDrafts, walletDrafts, walletDeployments, walletArchivedIds]);

  // Filtered pipelines based on search and status
  const filteredPipelines = useMemo(() => {
    return unifiedPipelines.filter((item) => {
      // Status filter
      if (statusFilter === 'DRAFTS' && ((!item.hasDraft && item.source !== 'local') || item.isArchived)) return false;
      if (statusFilter === 'ACTIVE' && !item.deployment) return false;
      if (statusFilter === 'ARCHIVED' && !item.isArchived) return false;
      if (statusFilter === 'ALL' && item.isArchived) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query);
        return matchesName || matchesDesc;
      }
      return true;
    });
  }, [unifiedPipelines, statusFilter, searchQuery]);

  // Handlers
  const handleOpenPipeline = (pipeline: PipelineItem) => {
    if (pipeline.source === 'local') {
      router.push(`/workspace/studio?local=${encodeURIComponent(pipeline.id)}`);
    } else if (pipeline.source === 'wallet') {
      if (pipeline.deployment) {
        router.push(`/workspace/studio?deployment=${encodeURIComponent(pipeline.deployment.pipelineId)}`);
      } else if (pipeline.hasDraft) {
        router.push(`/workspace/studio?pipeline=${encodeURIComponent(pipeline.id)}`);
      }
    } else if (pipeline.source === 'recipe') {
      router.push(`/workspace/studio?recipe=${encodeURIComponent(pipeline.id)}`);
    }
  };

  async function runAction(action: (signal: AbortSignal) => Promise<void>) {
    const signal = session.current?.signal;
    if (!signal || signal.aborted || actionInFlight.current) return;
    actionInFlight.current = true;
    setImportError(null);
    try {
      await action(signal);
    } catch (error) {
      if (!signal.aborted) setImportError(error instanceof Error ? error.message : 'Pipeline action failed.');
    } finally {
      actionInFlight.current = false;
    }
  }

  function storeWalletDraft(name: string, graph: ReturnType<typeof studioGraph>, signal: AbortSignal,
      revision?: { id: string; updatedAt: number }) {
    if (!address) throw new Error('Connect the workspace wallet.');
    return workspaceRequest<{ id: string; updatedAt: number }>(address, '/pipeline/drafts', {
      method: 'POST', signal,
      body: JSON.stringify({ graph: { ...graph, networks: graph.networks ?? STOP_LOSS_TEMPLATE.networks,
        metadata: { name, ownerAddress: address } }, revision }),
    });
  }

  async function readPipeline(item: PipelineItem, signal: AbortSignal, source: 'deployment' | 'draft' = 'deployment'): Promise<{ graph: unknown; updatedAt?: number }> {
    if (item.source === 'local') return { graph: item.graph };
    if (!address) throw new Error('Connect the workspace wallet.');
    const path = source === 'deployment' && item.deployment
      ? 'deployments/' + encodeURIComponent(item.deployment.pipelineId)
      : 'drafts/' + encodeURIComponent(item.id);
    return workspaceRequest(address, '/pipeline/' + path, { signal });
  }

  function createPipeline(name: string, graph: ReturnType<typeof studioGraph>, description?: string) {
    return runAction(async signal => {
      if (isConnected && address) {
        const result = await storeWalletDraft(name, graph, signal);
        if (!signal.aborted) router.push('/workspace/studio?pipeline=' + encodeURIComponent(result.id));
      } else {
        const id = crypto.randomUUID();
        saveBrowserDraft(id, name, graph, description);
        refreshLocalDrafts();
        router.push('/workspace/studio?local=' + encodeURIComponent(id));
      }
    });
  }

  const handleCreateBlank = (name: string) => void createPipeline(name, studioGraph([], []));

  const handleSelectRecipe = (recipeId: string) => {
    const preset = RECIPE_PRESETS[recipeId];
    if (preset) void createPipeline(preset.title, studioGraph(preset.nodes, preset.edges), preset.description);
  };

  const handleRenameSave = (name: string, description: string) => {
    const item = renamingPipeline;
    if (!item) return;
    void runAction(async signal => {
      if (item.source === 'local') {
        renameBrowserDraft(item.id, name, description);
        refreshLocalDrafts();
      } else if (item.hasDraft) {
        const snapshot = await readPipeline(item, signal, 'draft');
        if (signal.aborted) return;
        if (snapshot.updatedAt !== item.updatedAt) throw new Error('The saved draft changed. Refresh the list and try again.');
        const draft = parsePipelineDraft(JSON.stringify(snapshot.graph), draftNodeTypes);
        await storeWalletDraft(name, studioGraph(draft.nodes, draft.edges, draft.networks), signal,
          { id: item.id, updatedAt: item.updatedAt });
        if (signal.aborted) return;
        setReload(value => value + 1);
      }
      setRenamingPipeline(null);
    });
  };

  const handleDuplicate = (item: PipelineItem) => void runAction(async signal => {
    if (item.source === 'local') {
      duplicateBrowserDraft(item.id);
      refreshLocalDrafts();
      return;
    }
    const { graph } = await readPipeline(item, signal);
    if (signal.aborted) return;
    const draft = parsePipelineDraft(JSON.stringify(graph), draftNodeTypes);
    const copy = await storeWalletDraft(`${draft.name ?? item.name} (Copy)`, studioGraph(draft.nodes, draft.edges, draft.networks), signal);
    if (signal.aborted) return;
    if (item.deployment) {
      router.push(`/workspace/studio?pipeline=${encodeURIComponent(copy.id)}`);
    } else {
      setReload(value => value + 1);
    }
  });

  const handleArchive = (item: PipelineItem) => void runAction(async () => {
    archiveBrowserDraft(item.id, !item.isArchived);
    refreshLocalDrafts();
  });

  const handleDeleteConfirm = () => {
    const item = deletingPipeline;
    if (!item) return;
    void runAction(async (signal) => {
      if (item.source === 'local') {
        deleteBrowserDraft(item.id);
        refreshLocalDrafts();
      } else if (item.hasDraft && address) {
        await workspaceRequest(address, `/pipeline/drafts/${encodeURIComponent(item.id)}`, {
          method: 'DELETE',
          signal,
          body: JSON.stringify({ revision: { updatedAt: item.updatedAt } }),
        });
        if (!signal.aborted) setReload((v) => v + 1);
      }
      setDeletingPipeline(null);
    });
  };

  const handleExport = (item: PipelineItem) => void runAction(async signal => {
    const { graph } = await readPipeline(item, signal);
    if (signal.aborted) return;
    const draft = parsePipelineDraft(JSON.stringify(graph), draftNodeTypes);
    exportDraftJson(item.name, { ...studioGraph(draft.nodes, draft.edges, draft.networks),
      metadata: { name: item.name, description: draft.description ?? (item.source === 'local' ? item.description : undefined) } });
  });

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const signal = session.current?.signal;
    try {
      if (file.size > 1_048_576) throw new Error('File size exceeds 1 MB.');
      const parsed = parsePipelineDraft(await file.text(), draftNodeTypes);
      if (signal?.aborted) return;
      const name = parsed.name?.trim() || file.name.replace(/\.json$/i, '') || 'Imported Pipeline';
      await createPipeline(name, studioGraph(parsed.nodes, parsed.edges, parsed.networks), parsed.description);
    } catch (error) {
      if (!signal?.aborted) setImportError(error instanceof Error ? error.message : 'Invalid Studio JSON file.');
    }
  };

  return (
    <div className="ws-page">
      {/* Hidden file input for JSON import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportFile}
        accept=".json"
        className="hidden"
      />

      {/* Page Header */}
      <header className="ws-page-header">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-[var(--ws-accent-bg)] text-[var(--ws-accent)]">
              <Network className="size-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Pipeline Studio
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[var(--ws-muted)] mt-1">
            Build, manage, and inspect cross-chain automation pipelines. Click any pipeline card to open its visual node pipeline.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="ws-actions">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="ws-button"
            title="Import Studio JSON"
          >
            <Upload className="size-3.5" />
            <span>Import JSON</span>
          </button>

          <Link href="/workspace/templates" className="ws-button" title="Browse verified templates">
            <Library className="size-3.5" />
            <span>Browse Recipes</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="ws-button ws-button-primary"
            title="Create new pipeline"
          >
            <Plus className="size-3.5" />
            <span>New Pipeline</span>
          </button>
        </div>
      </header>

      {/* Guest-to-Wallet Import Banner (Section 1 & 7.2 of Operations Analysis) */}
      {isConnected && address && localDrafts.length > 0 && !dismissedGuestBanner && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[var(--ws-accent)]/30 bg-[var(--ws-accent-bg)]/30 p-3.5 text-xs text-zinc-200">
          <div className="flex items-center gap-2.5">
            <Upload className="size-4 text-[var(--ws-accent)] shrink-0" />
            <span>
              You have <strong>{localDrafts.length}</strong> browser drafts on this device. Would you like to import them to your connected wallet workspace?
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleImportAllGuestDrafts}
              disabled={isImportingGuest}
              className="inline-flex items-center gap-1.5 rounded-md bg-[var(--ws-accent)] text-[#111318] px-3 py-1.5 font-semibold text-xs hover:brightness-110 transition cursor-pointer"
            >
              {isImportingGuest ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
              <span>Import to Wallet</span>
            </button>
            <button
              type="button"
              onClick={() => setDismissedGuestBanner(true)}
              className="rounded-md px-2.5 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Guest import success toast */}
      {guestImportMessage && (
        <div role="status" className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs text-emerald-300">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
          <span>{guestImportMessage}</span>
        </div>
      )}

      {/* Import error notification */}
      {importError && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-rose-900/60 bg-rose-950/30 p-3 text-xs text-rose-300">
          <AlertCircle className="size-4 shrink-0 text-rose-400" />
          <span>{importError}</span>
        </div>
      )}

      {walletPending && <p role="status">Loading wallet pipelines...</p>}
      {walletError && <div role="alert">{walletError} <button type="button" className="ws-button" onClick={() => setReload(value => value + 1)}>Retry</button></div>}
      {localError && <p role="alert">Could not read browser drafts.</p>}

      {/* Toolbar: Search & Business Status Filter Tabs (All, Drafts, Active, Archived) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-[var(--ws-border)] bg-[var(--ws-panel)] p-2.5">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pipelines by name or description..."
            className="w-full rounded-md border border-[var(--ws-border)] bg-[#111318] pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-[var(--ws-accent)] focus:outline-none"
          />
        </div>

        {/* Filter Tabs (Mục 7.2: Tất cả, Có bản nháp, Có deployment, Đã lưu trữ) */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs">
          {(
            [
              { key: 'ALL', label: `All (${unifiedPipelines.filter(p => !p.isArchived).length})` },
              { key: 'DRAFTS', label: `Drafts (${unifiedPipelines.filter(p => (p.hasDraft || p.source === 'local') && !p.isArchived).length})` },
              { key: 'ACTIVE', label: `Deployments (${unifiedPipelines.filter(p => p.deployment).length})` },
              { key: 'ARCHIVED', label: `Archived (${unifiedPipelines.filter(p => p.isArchived).length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === tab.key
                  ? 'bg-[var(--ws-accent-bg)] text-[var(--ws-accent)] font-semibold'
                  : 'text-[var(--ws-muted)] hover:bg-white/5 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Pipeline Cards */}
      {filteredPipelines.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPipelines.map((pipeline) => (
            <PipelineCard
              key={`${pipeline.source}-${pipeline.id}`}
              pipeline={pipeline}
              onOpen={handleOpenPipeline}
              onOpenDraft={pipeline.deployment && pipeline.hasDraft
                ? () => router.push(`/workspace/studio?pipeline=${encodeURIComponent(pipeline.id)}`)
                : undefined}
              onRename={pipeline.source === 'local' || pipeline.hasDraft ? item => {
                setImportError(null);
                setRenamingPipeline(item);
              } : undefined}
              onDuplicate={handleDuplicate}
              onDelete={pipeline.source === 'local' || pipeline.hasDraft ? setDeletingPipeline : undefined}
              onExport={handleExport}
              onArchive={pipeline.source === 'local' ? handleArchive : undefined}
            />
          ))}
        </div>
      ) : walletPending || signInRequired || walletError || localError ? null : (
        /* Empty State */
        <div className="rounded-xl border border-dashed border-[var(--ws-border)] bg-[var(--ws-panel)]/50 p-12 text-center space-y-4">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-[var(--ws-accent-bg)] text-[var(--ws-accent)]">
            <Layers className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white">
              {searchQuery ? 'No pipelines found' : 'No pipelines created yet'}
            </h3>
            <p className="text-xs text-[var(--ws-muted)] max-w-sm mx-auto">
              {searchQuery
                ? 'No pipelines match your current search query. Try clearing the search or switching filters.'
                : 'Choose a verified automation blueprint from the Template Library or create a new blank pipeline to get started.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                }}
                className="ws-button"
              >
                Clear Search
              </button>
            ) : (
              <>
                <Link
                  href="/workspace/templates"
                  className="ws-button inline-flex items-center gap-1.5"
                >
                  <Library className="size-3.5" />
                  <span>Browse Templates</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(true)}
                  className="ws-button ws-button-primary inline-flex items-center gap-1.5"
                >
                  <Plus className="size-3.5" />
                  <span>New Pipeline</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <NewPipelineModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreateBlank={handleCreateBlank}
        onSelectRecipe={handleSelectRecipe}
      />

      {renamingPipeline && (
        <RenamePipelineModal
          isOpen={!!renamingPipeline}
          currentName={renamingPipeline.name}
          currentDescription={renamingPipeline.description}
          nameOnly={renamingPipeline.source === 'wallet'}
          error={importError}
          onClose={() => setRenamingPipeline(null)}
          onSave={handleRenameSave}
        />
      )}

      {deletingPipeline && (
        <DeletePipelineModal
          isOpen={!!deletingPipeline}
          pipelineName={deletingPipeline.name}
          deploymentId={deletingPipeline.deployment?.pipelineId}
          onClose={() => setDeletingPipeline(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
