'use client';

import React, { useState, useMemo, useLayoutEffect, useRef } from 'react';
import { WorkspacePageHeader, WorkspaceState } from '@/components/common/WorkspaceUI';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RECIPE_PRESETS } from '@/lib/recipes';
import { listBrowserDrafts, resolveUniquePipelineName, saveBrowserDraft, studioGraph } from '@/lib/pipelineDraft';
import { fetchActiveWalletPipelineNames } from '@/lib/deployments';
import { workspaceRequest } from '@/lib/workspaceSession';
import { useAccount } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { invalidateDraftsCache } from '@/lib/workspaceCache';
import { useWorkspaceFilterStore } from '@/lib/workspaceFilterStore';
import { 
  Library, 
  ArrowRight, 
  TrendingDown, 
  RefreshCw, 
  Flame, 
  Wallet, 
  Globe, 
  Zap, 
  Search, 
  Clock, 
  ShieldCheck, 
  X 
} from 'lucide-react';

interface Recipe {
  id: string;
  category: 'defi' | 'security' | 'cron' | 'crosschain';
  categoryLabel: string;
  title: string;
  description: string;
  icon: React.ElementType;
  nodesCount: number;
  trigger: string;
  action: string;
  cooldown: string;
  targetChain: string;
  nodesList: {
    name: string;
    type: 'trigger' | 'condition' | 'action';
    summary: string;
  }[];
  rscSnippet: string;
}

const RECIPES: Recipe[] = [
  {
    id: 'stop-loss',
    category: 'defi',
    categoryLabel: 'DeFi Risk',
    title: 'Flash Crash Stop-Loss',
    description: 'Monitors DEX pool reserves and executes a 50% stop-loss swap to USDC when spot price breaches the threshold.',
    icon: TrendingDown,
    nodesCount: 4,
    trigger: 'ETH Spot <= $1,800',
    action: 'Swap 50% to USDC',
    cooldown: '300s',
    targetChain: 'Base Sepolia',
    nodesList: [
      { name: 'DEX Sync Event Listener', type: 'trigger', summary: 'Subscribes to Base Sepolia Uniswap pair Sync events' },
      { name: 'Price Threshold Filter', type: 'condition', summary: 'Validates reserve0 / reserve1 against $1,800 threshold' },
      { name: 'Cooldown Rate-Limiter', type: 'condition', summary: 'Rejects duplicate triggers within a 300s window' },
      { name: 'ActionVault Stop-Loss', type: 'action', summary: 'Executes swap to USDC with 5% slippage protection' }
    ],
    rscSnippet: `// Reactive Smart Contract (Lasna #5318007)
function react(LogRecord calldata record) external vmOnly {
    if (block.timestamp - lastTriggered < COOLDOWN) return;
    (uint112 r0, uint112 r1) = abi.decode(record.data, (uint112, uint112));
    uint256 price = (uint256(r1) * 1e18) / uint256(r0);
    if (price <= STOP_PRICE) {
        lastTriggered = block.timestamp;
        bytes memory payload = abi.encodeWithSelector(IActionVault.executeStopLoss.selector, 50);
        emit Callback(CHAIN_ID_BASE, vaultAddress, GAS_LIMIT, payload);
    }
}`
  },
  {
    id: 'take-profit',
    category: 'defi',
    categoryLabel: 'DeFi Risk',
    title: 'Take-Profit Scalper',
    description: 'Monitors AMM liquidity for price surges and locks in 50% profit to USDC when ETH crosses target price.',
    icon: RefreshCw,
    nodesCount: 4,
    trigger: 'ETH Spot >= $2,800',
    action: 'Sell 50% to USDC',
    cooldown: '600s',
    targetChain: 'Base Sepolia',
    nodesList: [
      { name: 'Uniswap Sync Listener', type: 'trigger', summary: 'Base Sepolia DEX liquidity tracking' },
      { name: 'High-Watermark Check', type: 'condition', summary: 'Validates spot price is above $2,800 target' },
      { name: 'Cooldown Rate-Limiter', type: 'condition', summary: 'Enforces 600s minimum interval between orders' },
      { name: 'Vault Liquidate Action', type: 'action', summary: 'Swaps 50% of Vault ETH balance to USDC' }
    ],
    rscSnippet: `// Reactive Take-Profit Logic
if (price >= TARGET_PROFIT && block.timestamp - lastTriggered >= 600) {
    lastTriggered = block.timestamp;
    bytes memory payload = abi.encodeWithSelector(IActionVault.executeTakeProfit.selector, 50);
    emit Callback(CHAIN_ID_BASE, vaultAddress, GAS_LIMIT, payload);
}`
  },
  {
    id: 'anti-drainer',
    category: 'security',
    categoryLabel: 'Security',
    title: 'Anti-Drainer SafeSweep',
    description: 'Monitors vault transactions and sweeps all assets to cold storage if unauthorized outbound transfers exceed 1.0 ETH.',
    icon: Flame,
    nodesCount: 3,
    trigger: 'Outbound > 1.0 ETH',
    action: 'Sweep 100% to Cold Safe',
    cooldown: '60s',
    targetChain: 'Base Sepolia',
    nodesList: [
      { name: 'Watch Transfers', type: 'trigger', summary: 'Monitors outbound native ETH and token transfers' },
      { name: 'Cooldown Rate-Limiter', type: 'condition', summary: 'Enforces 60s cooldown buffer to prevent storming' },
      { name: 'Emergency SafeSweep', type: 'action', summary: 'Sweeps all vault assets to designated backup cold multi-sig' }
    ],
    rscSnippet: `// 1-Tx Emergency SafeSweep
if (isUnauthorizedEgress(record)) {
    bytes memory payload = abi.encodeWithSelector(IActionVault.executeSafeSweep.selector, COLD_SAFE_ADDRESS);
    emit Callback(CHAIN_ID_BASE, vaultAddress, GAS_LIMIT, payload);
}`
  },
  {
    id: 'cron-rebalance',
    category: 'cron',
    categoryLabel: 'Cron',
    title: 'Daily Portfolio Rebalancer',
    description: 'Autonomous rebalancer triggered every 24 hours directly via ReactVM consensus to rebalance 10% ETH into USDC.',
    icon: Clock,
    nodesCount: 3,
    trigger: 'Every 24 Hours',
    action: 'Rebalance 10% to USDC',
    cooldown: '86,400s',
    targetChain: 'Base Sepolia',
    nodesList: [
      { name: 'Periodic Cron (24h)', type: 'trigger', summary: 'On-chain CometBFT block interval clock' },
      { name: 'Solvency Check', type: 'condition', summary: 'Verifies Vault balance is above 0.1 ETH minimum' },
      { name: 'Rebalance Swap', type: 'action', summary: 'Swaps 10% ETH to USDC at 1% max slippage' }
    ],
    rscSnippet: `// Zero-Keeper Autonomous Cron
if (block.timestamp - lastRebalance >= 1 days) {
    lastRebalance = block.timestamp;
    bytes memory payload = abi.encodeWithSelector(IActionVault.rebalancePortfolio.selector);
    emit Callback(CHAIN_ID_BASE, vaultAddress, GAS_LIMIT, payload);
}`
  },
  {
    id: 'payday-splitter',
    category: 'crosschain',
    categoryLabel: 'Cross-Chain',
    title: 'Payday Auto-Splitter',
    description: 'Splits incoming deposits over 1,000 USDC: routes 20% to ETH DCA, 30% to cold storage, and retains liquid funds.',
    icon: Wallet,
    nodesCount: 5,
    trigger: 'Inflow >= 1,000 USDC',
    action: '20% DCA + 30% Cold Safe',
    cooldown: '3,600s',
    targetChain: 'Base Sepolia',
    nodesList: [
      { name: 'Salary Transfer Watcher', type: 'trigger', summary: 'Listens for incoming USDC deposits' },
      { name: 'Threshold Check', type: 'condition', summary: 'Requires minimum 1,000 USDC transfer volume' },
      { name: 'DCA 20% into ETH', type: 'action', summary: 'Routes 20% into ETH spot accumulation' },
      { name: 'Sweep 30% to Cold Safe', type: 'action', summary: 'Sweeps 30% to secure multi-sig safe' },
      { name: 'Webhook Notification', type: 'action', summary: 'Sends execution alert webhook to user' }
    ],
    rscSnippet: `// Income Splitter Execution
if (record.topic2 == bytes32(uint256(uint160(vaultAddress))) && amount >= 1000e6) {
    bytes memory payload = abi.encodeWithSelector(IActionVault.splitInflow.selector, 20, 30, 50);
    emit Callback(CHAIN_ID_BASE, vaultAddress, GAS_LIMIT, payload);
}`
  },
  {
    id: 'cross-chain-hedge',
    category: 'crosschain',
    categoryLabel: 'Cross-Chain',
    title: 'Unichain-to-Base Cross Hedge',
    description: 'Monitors liquidity velocity on Unichain Sepolia and triggers a defensive hedge swap on Base Sepolia.',
    icon: Globe,
    nodesCount: 4,
    trigger: 'Drop > 5% in 10s on Unichain',
    action: 'Hedge Swap on Base Sepolia',
    cooldown: '300s',
    targetChain: 'Base Sepolia',
    nodesList: [
      { name: 'Watch DEX Unichain', type: 'trigger', summary: 'Cross-chain event listener on Unichain Sepolia' },
      { name: 'Price Velocity Guard', type: 'condition', summary: 'Detects velocity drops exceeding 5% in 10s' },
      { name: 'Cooldown Rate-Limiter', type: 'condition', summary: '300s rate-limiting cooldown buffer' },
      { name: 'Base Sepolia Swap', type: 'action', summary: 'Fires callback to ActionVault on Base Sepolia' }
    ],
    rscSnippet: `// Multi-Network Reactive Bridge
if (velocityDrop > VELOCITY_LIMIT && block.timestamp - lastTriggered >= 300) {
    lastTriggered = block.timestamp;
    emit Callback(CHAIN_ID_BASE_SEPOLIA, baseVault, GAS_LIMIT, payload);
}`
  },
];

export default function TemplateLibraryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { address, isConnected } = useAccount();
  const owner = isConnected ? address : undefined;
  const scope = useRef<AbortController>();
  const pending = useRef(false);
  const [creationError, setCreationError] = useState<string>();

  useLayoutEffect(() => {
    const controller = new AbortController();
    scope.current = controller;
    pending.current = false;
    setCreationError(undefined);
    return () => controller.abort();
  }, [owner]);

  const {
    templatesCategory: activeCategory,
    templatesSearch: searchQuery,
    setTemplatesCategory: setActiveCategory,
    setTemplatesSearch: setSearchQuery,
  } = useWorkspaceFilterStore();
  const [inspectingRecipe, setInspectingRecipe] = useState<Recipe | null>(null);

  const handleHydrateRecipe = async (recipe: Recipe) => {
    const preset = RECIPE_PRESETS[recipe.id];
    const signal = scope.current?.signal;
    if (!preset || !signal || signal.aborted || pending.current) return;
    pending.current = true;
    setCreationError(undefined);
    const graph = studioGraph(preset.nodes, preset.edges);
    try {
      if (owner) {
        const existingNames = await fetchActiveWalletPipelineNames(owner, {
          signal,
          sessionOnly: false,
          queryClient,
        });
        if (signal.aborted) return;
        const uniqueTitle = resolveUniquePipelineName(recipe.title, existingNames, 'numbered');
        const draft = await workspaceRequest<{ id: string }>(owner, '/pipeline/drafts', {
          method: 'POST', signal,
          body: JSON.stringify({ graph: { ...graph, metadata: { name: uniqueTitle, ownerAddress: owner } } }),
        });
        await invalidateDraftsCache(queryClient, owner);
        if (!signal.aborted) router.push('/workspace/studio?pipeline=' + encodeURIComponent(draft.id));
      } else {
        const id = crypto.randomUUID();
        const existingNames = listBrowserDrafts().filter((draft) => !draft.isArchived).map((draft) => draft.name);
        const uniqueTitle = resolveUniquePipelineName(recipe.title, existingNames, 'numbered');
        saveBrowserDraft(id, uniqueTitle, graph, recipe.description);
        router.push('/workspace/studio?local=' + encodeURIComponent(id));
      }
    } catch (error) {
      if (!signal.aborted) setCreationError(error instanceof Error ? error.message : 'Could not create the pipeline.');
    } finally {
      if (!signal.aborted) pending.current = false;
    }
  };

  const categories = [
    { id: 'all', label: 'All', count: RECIPES.length },
    { id: 'defi', label: 'DeFi Risk', count: RECIPES.filter(r => r.category === 'defi').length },
    { id: 'security', label: 'Security', count: RECIPES.filter(r => r.category === 'security').length },
    { id: 'cron', label: 'Cron', count: RECIPES.filter(r => r.category === 'cron').length },
    { id: 'crosschain', label: 'Cross-Chain', count: RECIPES.filter(r => r.category === 'crosschain').length },
  ];

  const filteredRecipes = useMemo(() => {
    return RECIPES.filter((r) => {
      if (activeCategory !== 'all' && r.category !== activeCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = r.title.toLowerCase().includes(q);
        const matchesDesc = r.description.toLowerCase().includes(q);
        const matchesCat = r.categoryLabel.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesCat) return false;
      }
      return true;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="ws-page space-y-5">
      {creationError && <p role="alert" className="text-sm text-rose-300">{creationError}</p>}
      
      <WorkspacePageHeader
        title="Templates"
        description="Pre-built workflows for cross-chain automation, risk control, and scheduled tasks."
        icon={<Library className="size-4" />}
        actions={
          <Link href="/workspace/studio" className="ws-button ws-button-primary inline-flex items-center gap-1.5">
            <Zap className="size-3.5" />
            <span>Open Studio</span>
          </Link>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-[var(--ws-border)] bg-[var(--ws-panel)] p-2">
        {/* Category Pills */}
        <div className="flex items-center gap-1 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              aria-pressed={activeCategory === cat.id}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-[var(--ws-accent-bg)] text-[var(--ws-accent)] font-semibold'
                  : 'text-[var(--ws-muted)] hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>{cat.label}</span>
              <span className="text-[11px] tabular-nums opacity-60">
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-xs">
          <Search className="size-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter templates..."
            className="w-full rounded-md border border-[var(--ws-border)] bg-[#111318] pl-9 pr-7 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-[var(--ws-accent)] focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>

      {/* Clean Templates Grid */}
      {filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecipes.map((recipe) => {
            const Icon = recipe.icon;
            return (
              <div
                key={recipe.id}
                className="group flex flex-col justify-between rounded-xl border border-[var(--ws-border)] bg-[var(--ws-panel)] p-4 transition-colors duration-150 hover:border-zinc-500/60"
              >
                <div className="space-y-3">
                  {/* Card Header: Icon, Title, Category & Node Count */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-zinc-300 group-hover:text-white transition-colors shrink-0">
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-white tracking-tight truncate">
                          {recipe.title}
                        </h3>
                        <p className="text-[11px] text-[var(--ws-muted)] flex items-center gap-1.5 mt-0.5">
                          <span>{recipe.categoryLabel}</span>
                          <span>·</span>
                          <span className="tabular-nums">{recipe.nodesCount} nodes</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Concise Description */}
                  <p className="text-xs text-[var(--ws-muted)] leading-relaxed line-clamp-2 min-h-[2.5rem]">
                    {recipe.description}
                  </p>

                  {/* Trigger & Action Summary */}
                  <div className="grid grid-cols-2 gap-2 text-xs py-2 px-2.5 rounded-lg bg-black/25 border border-white/[0.04]">
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-0.5">Trigger</span>
                      <span className="font-medium text-zinc-200 truncate block text-xs" title={recipe.trigger}>
                        {recipe.trigger}
                      </span>
                    </div>
                    <div className="min-w-0 border-l border-white/[0.06] pl-2.5">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-0.5">Action</span>
                      <span className="font-medium text-emerald-400 truncate block text-xs" title={recipe.action}>
                        {recipe.action}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 mt-3 border-t border-[var(--ws-border)] flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInspectingRecipe(recipe)}
                    className="ws-button text-xs px-2.5 py-1.5 text-[var(--ws-muted)] hover:text-white"
                  >
                    Specs
                  </button>
                  <button
                    type="button"
                    onClick={() => handleHydrateRecipe(recipe)}
                    className="ws-button ws-button-primary flex-1 text-xs py-1.5 font-semibold inline-flex items-center justify-center gap-1.5"
                  >
                    <Zap className="size-3.5" />
                    <span>Use Template</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <WorkspaceState
          title="No templates found."
          description="No automation templates match your current filters. Try adjusting your search term."
          icon={<Library className="size-6" />}
        />
      )}

      {/* Slide-Over Architecture Preview Drawer */}
      {inspectingRecipe && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
          <div className="w-full max-w-xl bg-[#111318] border-l border-[var(--ws-border)] shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-5 border-b border-[var(--ws-border)] flex items-center justify-between bg-[#15171e]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Library className="w-4 h-4 text-[var(--ws-accent)]" />
                  <h3 className="text-sm font-semibold text-white">
                    {inspectingRecipe.title}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[11px] bg-white/[0.06] text-zinc-300 border border-white/10 tabular-nums">
                    {inspectingRecipe.nodesCount} Nodes
                  </span>
                </div>
                <p className="text-xs text-[var(--ws-muted)]">
                  {inspectingRecipe.categoryLabel}
                </p>
              </div>

              <button
                onClick={() => setInspectingRecipe(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {/* Description */}
              <div className="p-3.5 rounded-xl bg-[var(--ws-panel)] border border-[var(--ws-border)] text-zinc-300 leading-relaxed">
                {inspectingRecipe.description}
              </div>

              {/* Execution Parameters */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-3 rounded-lg bg-[var(--ws-panel)] border border-[var(--ws-border)]">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">Target Chain</span>
                  <span className="font-medium text-white mt-1 block">{inspectingRecipe.targetChain}</span>
                </div>
                <div className="p-3 rounded-lg bg-[var(--ws-panel)] border border-[var(--ws-border)]">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">Reactive Core</span>
                  <span className="font-medium text-white mt-1 block">Lasna (#5318007)</span>
                </div>
                <div className="p-3 rounded-lg bg-[var(--ws-panel)] border border-[var(--ws-border)]">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">Cooldown</span>
                  <span className="font-medium text-white mt-1 block">{inspectingRecipe.cooldown}</span>
                </div>
              </div>

              {/* Node Breakdown */}
              <div className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Node Architecture
                </div>
                <div className="space-y-2">
                  {inspectingRecipe.nodesList.map((node, i) => (
                    <div key={i} className="p-3 rounded-xl bg-[var(--ws-panel)] border border-[var(--ws-border)] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-white">{node.name}</span>
                        <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-semibold border ${
                          node.type === 'trigger'
                            ? 'bg-sky-500/10 text-sky-300 border-sky-500/20'
                            : node.type === 'condition'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                        }`}>
                          {node.type}
                        </span>
                      </div>
                      <p className="text-zinc-400 text-xs">{node.summary}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reactive Smart Contract Logic */}
              <div className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Reactive Smart Contract (RSC)
                </div>
                <div className="p-3.5 bg-black/40 rounded-xl border border-[var(--ws-border)] overflow-x-auto text-[11px] font-mono text-zinc-300 leading-relaxed">
                  <pre>{inspectingRecipe.rscSnippet}</pre>
                </div>
              </div>

              {/* Execution Guarantees */}
              <div className="p-3.5 rounded-xl border border-[var(--ws-border)] bg-[var(--ws-panel)] space-y-1">
                <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-emerald-400" />
                  <span>Execution Guard</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Protected by stateless timestamp cooldowns against 200ms block storms. The destination ActionVault enforces non-custodial emergency withdrawals and on-chain price re-validation.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--ws-border)] bg-[#15171e] flex items-center justify-between gap-3">
              <button
                onClick={() => setInspectingRecipe(null)}
                className="px-4 py-2 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-white font-medium transition-colors text-xs"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  setInspectingRecipe(null);
                  handleHydrateRecipe(inspectingRecipe);
                }}
                className="ws-button ws-button-primary flex items-center gap-2 px-5 py-2 text-xs font-semibold"
              >
                <Zap className="size-3.5" />
                <span>Use Template</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
