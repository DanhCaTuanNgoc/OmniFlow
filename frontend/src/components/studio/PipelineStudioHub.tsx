'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { WorkspaceWalletPromptCancelled, workspaceRequest } from '@/lib/workspaceSession';
import { RECIPE_PRESETS } from '@/lib/recipes';
import { PALETTE_ITEMS } from '@/components/canvas/NodePalette';

import { PipelineCard, type PipelineItem } from './PipelineCard';
import { RenamePipelineModal } from './RenamePipelineModal';
import { DeletePipelineModal } from './DeletePipelineModal';
import { NewPipelineModal } from './NewPipelineModal';

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
  const [walletPending, setWalletPending] = useState(false);
  const [walletError, setWalletError] = useState<string>();

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

    let isMounted = true;
    async function fetchWalletData(owner: Address) {
      setWalletPending(true);
      setWalletError(undefined);
      try {
        const [draftsRes, depsRes] = await Promise.allSettled([
          workspaceRequest<{ drafts: WalletDraftSummary[] }>(owner, '/pipeline/drafts'),
          workspaceRequest<{ deployments: DeploymentSummary[] }>(owner, '/pipeline/deployments'),
        ]);

        if (isMounted) {
          if (draftsRes.status === 'fulfilled') {
            setWalletDrafts(draftsRes.value.drafts || []);
          }
          if (depsRes.status === 'fulfilled') {
            setWalletDeployments(depsRes.value.deployments || []);
          }
        }
      } catch (err) {
        if (isMounted) {
          setWalletError(err instanceof Error ? err.message : 'Unable to load wallet data.');
        }
      } finally {
        if (isMounted) {
          setWalletPending(false);
        }
      }
    }

    fetchWalletData(address);
    return () => {
      isMounted = false;
    };
  }, [isConnected, address]);

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
          body: JSON.stringify(payload),
        });
        deleteBrowserDraft(draft.id);
        importedCount++;
      }
      refreshLocalDrafts();
      setGuestImportMessage(`Successfully imported ${importedCount} browser drafts to your wallet workspace.`);
      setTimeout(() => setGuestImportMessage(null), 5000);
      setDismissedGuestBanner(true);
      const draftsRes = await workspaceRequest<{ drafts: WalletDraftSummary[] }>(address, '/pipeline/drafts');
      setWalletDrafts(draftsRes.drafts || []);
    } catch (err) {
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
    const processedDepIds = new Set<string>();

    for (const wDraft of walletDrafts) {
      const matchingDep = walletDeployments.find((d) => d.workspacePipelineId === wDraft.id);
      if (matchingDep) processedDepIds.add(matchingDep.pipelineId);

      const isArchived = walletArchivedIds.includes(wDraft.id);
      const status: PipelineItem['status'] = matchingDep
        ? matchingDep.status === 'deployed'
          ? 'deployed'
          : matchingDep.status === 'signed'
          ? 'pending'
          : 'draft'
        : 'draft';

      items.push({
        id: wDraft.id,
        name: wDraft.name,
        description: matchingDep
          ? `Revision draft in progress · Running live on ${matchingDep.contracts.vaultChainId === 84532 ? 'Base Sepolia' : 'Chain'}.`
          : 'Synchronized on-chain wallet workspace draft.',
        updatedAt: wDraft.updatedAt,
        source: 'wallet',
        hasDraft: true,
        deployment: matchingDep,
        status,
        isArchived,
      });
    }

    // Standalone deployments that don't have a separate draft revision
    for (const dep of walletDeployments) {
      if (processedDepIds.has(dep.pipelineId)) continue;
      const isArchived = walletArchivedIds.includes(dep.pipelineId);
      items.push({
        id: dep.pipelineId,
        name: dep.name,
        description: `Deployed RSC (${dep.contracts.rscAddress?.slice(0, 10)}...) on Lasna & ActionVault on Base Sepolia.`,
        updatedAt: dep.createdAt,
        source: 'wallet',
        hasDraft: false,
        deployment: dep,
        status: dep.status === 'deployed' ? 'deployed' : dep.status === 'signed' ? 'pending' : 'draft',
        isArchived,
      });
    }

    return items;
  }, [localDrafts, walletDrafts, walletDeployments, walletArchivedIds]);

  // Filtered pipelines based on search and status
  const filteredPipelines = useMemo(() => {
    return unifiedPipelines.filter((item) => {
      // Status filter
      if (statusFilter === 'DRAFTS' && (item.status === 'deployed' || item.isArchived)) return false;
      if (statusFilter === 'ACTIVE' && item.status !== 'deployed') return false;
      if (statusFilter === 'ARCHIVED' && !item.isArchived) return false;
      if (statusFilter === 'ALL' && item.isArchived) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
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
      if (pipeline.hasDraft) {
        router.push(`/workspace/studio?pipeline=${encodeURIComponent(pipeline.id)}`);
      } else if (pipeline.deployment) {
        router.push(`/workspace/studio?deployment=${encodeURIComponent(pipeline.deployment.pipelineId)}`);
      }
    } else if (pipeline.source === 'recipe') {
      router.push(`/workspace/studio?recipe=${encodeURIComponent(pipeline.id)}`);
    }
  };

  const handleCreateBlank = (name: string) => {
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `draft-${Date.now()}`;
    saveBrowserDraft(newId, name, { nodes: [], edges: [] });
    refreshLocalDrafts();
    router.push(`/workspace/studio?local=${encodeURIComponent(newId)}`);
  };

  const handleSelectRecipe = (recipeId: string) => {
    const preset = RECIPE_PRESETS[recipeId];
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `draft-${Date.now()}`;
    const graph = preset ? { nodes: preset.nodes, edges: preset.edges } : { nodes: [], edges: [] };
    saveBrowserDraft(newId, preset?.title || 'New Pipeline', graph, preset?.description);
    refreshLocalDrafts();
    router.push(`/workspace/studio?local=${encodeURIComponent(newId)}`);
  };

  const handleRenameSave = (newName: string, newDescription: string) => {
    if (!renamingPipeline) return;
    if (renamingPipeline.source === 'local') {
      renameBrowserDraft(renamingPipeline.id, newName, newDescription);
      refreshLocalDrafts();
    } else {
      // If wallet draft, rename locally in state
      setWalletDrafts((prev) =>
        prev.map((d) => (d.id === renamingPipeline.id ? { ...d, name: newName } : d))
      );
    }
    setRenamingPipeline(null);
  };

  const handleDuplicate = (pipeline: PipelineItem) => {
    if (pipeline.source === 'local') {
      duplicateBrowserDraft(pipeline.id);
      refreshLocalDrafts();
    } else if (pipeline.source === 'recipe' && pipeline.graph) {
      const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `draft-${Date.now()}`;
      saveBrowserDraft(newId, `${pipeline.name} (Custom)`, pipeline.graph, pipeline.description);
      refreshLocalDrafts();
    }
  };

  const handleArchive = (pipeline: PipelineItem) => {
    if (pipeline.source === 'local') {
      archiveBrowserDraft(pipeline.id, !pipeline.isArchived);
      refreshLocalDrafts();
    } else if (pipeline.source === 'wallet' && address) {
      const willArchive = !pipeline.isArchived;
      const next = willArchive
        ? [...walletArchivedIds, pipeline.id]
        : walletArchivedIds.filter((id) => id !== pipeline.id);
      setWalletArchivedIds(next);
      localStorage.setItem(`omniflow.archived.pipelines.${address.toLowerCase()}`, JSON.stringify(next));
    }
  };

  const handleDeleteConfirm = () => {
    if (!deletingPipeline) return;
    if (deletingPipeline.source === 'local') {
      deleteBrowserDraft(deletingPipeline.id);
      refreshLocalDrafts();
    } else if (deletingPipeline.source === 'wallet') {
      setWalletDrafts((prev) => prev.filter((d) => d.id !== deletingPipeline.id));
    }
    setDeletingPipeline(null);
  };

  const handleExport = (pipeline: PipelineItem) => {
    if (pipeline.graph) {
      exportDraftJson(pipeline.name, pipeline.graph);
    } else {
      // If wallet draft without graph in memory, open it first
      handleOpenPipeline(pipeline);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    setImportError(null);
    if (!file) return;

    try {
      if (file.size > 1_048_576) throw new Error('File size exceeds 1 MB.');
      const text = await file.text();
      const parsed = parsePipelineDraft(text, draftNodeTypes);
      const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `import-${Date.now()}`;
      const name = file.name.replace(/\.json$/i, '') || 'Imported Pipeline';
      saveBrowserDraft(newId, name, { nodes: parsed.nodes, edges: parsed.edges, networks: parsed.networks });
      refreshLocalDrafts();
      router.push(`/workspace/studio?local=${encodeURIComponent(newId)}`);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Invalid Studio JSON file.');
      setTimeout(() => setImportError(null), 5000);
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
              { key: 'DRAFTS', label: `Drafts (${unifiedPipelines.filter(p => p.status !== 'deployed' && !p.isArchived).length})` },
              { key: 'ACTIVE', label: `Active (${unifiedPipelines.filter(p => p.status === 'deployed').length})` },
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
              onRename={(item) => setRenamingPipeline(item)}
              onDuplicate={handleDuplicate}
              onDelete={(item) => setDeletingPipeline(item)}
              onExport={handleExport}
              onArchive={handleArchive}
            />
          ))}
        </div>
      ) : (
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
          onClose={() => setRenamingPipeline(null)}
          onSave={handleRenameSave}
        />
      )}

      {deletingPipeline && (
        <DeletePipelineModal
          isOpen={!!deletingPipeline}
          pipelineName={deletingPipeline.name}
          onClose={() => setDeletingPipeline(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
