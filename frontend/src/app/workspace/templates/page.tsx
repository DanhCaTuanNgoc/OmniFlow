'use client';

import React, { useState, useMemo, useLayoutEffect, useRef } from 'react';
import { WorkspacePageHeader, WorkspaceState } from '@/components/common/WorkspaceUI';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RECIPE_PRESETS } from '@/lib/recipes';
import { saveBrowserDraft, studioGraph } from '@/lib/pipelineDraft';
import { workspaceRequest } from '@/lib/workspaceSession';
import { useAccount } from 'wagmi';
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
  ShieldAlert,
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
  tagColor: string;
  tags: string[];
  nodesCount: number;
  flow: {
    trigger: string;
    condition: string;
    action: string;
  };
  metrics: {
    cooldown: string;
  };
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
    description: 'Monitors DEX pool reserves and automatically executes an emergency swap to USDC when spot price breaches threshold.',
    icon: TrendingDown,
    tagColor: 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10',
    tags: ['DeFi Risk', 'Uniswap V2', 'Base Sepolia'],
    nodesCount: 4,
    flow: {
      trigger: 'Sync(reserve0, reserve1)',
      condition: 'Price <= $1,800',
      action: 'ActionVault.executeStopLoss(50%)'
    },
    metrics: {
      cooldown: '300s Cooldown Guard',
    },
    nodesList: [
      { name: 'DEX Sync Event Listener', type: 'trigger', summary: 'Subscribes to Base Sepolia Uniswap pair topic0 0x1c411e9a...' },
      { name: 'Price Threshold Filter', type: 'condition', summary: 'Computes reserve0 / reserve1 in fixed-point 18 decimals against $1800 target' },
      { name: 'Stateless Cooldown Guard', type: 'condition', summary: 'Rejects rapid flurry events within 300s window to protect against 200ms block storms' },
      { name: 'ActionVault Stop-Loss', type: 'action', summary: 'Rechecks the pool price and applies the Vault’s fixed 5% slippage cap to its router quote' }
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
    description: 'Monitors AMM liquidity for upside surges and autonomously locks in positions into stablecoins with slippage protection.',
    icon: RefreshCw,
    tagColor: 'text-amber-300 border-amber-500/30 bg-amber-500/10',
    tags: ['Profit Taking', 'AMM Sync', 'Rate-Limited'],
    nodesCount: 4,
    flow: {
      trigger: 'Sync(reserve0, reserve1)',
      condition: 'Price >= $2,500',
      action: 'ActionVault.executeTakeProfit(25%)'
    },
    metrics: {
      cooldown: '600s Cooldown Guard',
    },
    nodesList: [
      { name: 'Uniswap Sync Listener', type: 'trigger', summary: 'Base Sepolia DEX liquidity tracking' },
      { name: 'High-Watermark Check', type: 'condition', summary: 'Ensures target exit price is exceeded' },
      { name: 'MEV Re-Validation Guard', type: 'condition', summary: 'Simulates minimum return before execution' },
      { name: 'Vault Liquidate Action', type: 'action', summary: 'Swaps collateral to USDC safe holding' }
    ],
    rscSnippet: `// Reactive Take-Profit Logic
if (price >= TARGET_PROFIT && block.timestamp - lastTriggered >= 600) {
    lastTriggered = block.timestamp;
    bytes memory payload = abi.encodeWithSelector(IActionVault.executeTakeProfit.selector, 25);
    emit Callback(CHAIN_ID_BASE, vaultAddress, GAS_LIMIT, payload);
}`
  },
  {
    id: 'anti-drainer',
    category: 'security',
    categoryLabel: 'Security',
    title: 'Anti-Drainer Cold SafeSweep',
    description: 'Detects unauthorized high-value transfers or drain attempts and immediately sweeps vault collateral to cold storage.',
    icon: Flame,
    tagColor: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
    tags: ['Anti-Phishing', '1-Tx Evacuation', 'Cold Safe'],
    nodesCount: 3,
    flow: {
      trigger: 'Transfer(from == Owner)',
      condition: 'Value > 1.0 ETH',
      action: 'ActionVault.executeSafeSweep(coldSafe)'
    },
    metrics: {
      cooldown: 'Stateless 0s (Instant)',
    },
    nodesList: [
      { name: 'Wallet Egress Filter', type: 'trigger', summary: 'Monitors outbound Transfer and Approval events' },
      { name: 'Anomaly Detector', type: 'condition', summary: 'Identifies non-whitelisted destinations or excess drain' },
      { name: 'SafeSweep Emergency Evac', type: 'action', summary: 'Sweeps entire vault collateral to cold multi-sig' }
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
    categoryLabel: 'Autonomous Cron',
    title: 'Daily Portfolio Rebalancer',
    description: 'Zero-server automated portfolio rebalancer triggered every 24 hours directly via ReactVM block interval consensus.',
    icon: ShieldAlert,
    tagColor: 'text-violet-300 border-violet-500/30 bg-violet-500/10',
    tags: ['Cron Tick', 'Zero Server', 'Reactive Core'],
    nodesCount: 3,
    flow: {
      trigger: 'ReactVM Block Epoch',
      condition: 'Delta >= 86,400s',
      action: 'ActionVault.rebalancePortfolio()'
    },
    metrics: {
      cooldown: '86400s Interval',
    },
    nodesList: [
      { name: 'System Block Interval', type: 'trigger', summary: 'Pure on-chain Lasna CometBFT time keeper' },
      { name: 'Epoch Threshold Check', type: 'condition', summary: 'Asserts 24 hours elapsed since last run' },
      { name: 'Portfolio Rebalancer', type: 'action', summary: 'Re-allocates collateral ratios' }
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
    description: 'Autonomously splits incoming payment deposits: routes portions to ETH DCA, yield cold vault, and liquid spending.',
    icon: Wallet,
    tagColor: 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10',
    tags: ['Salary Split', 'Multi-Signal', 'Non-Custodial'],
    nodesCount: 5,
    flow: {
      trigger: 'ERC20.Transfer(to == Vault)',
      condition: 'Value >= 1,000 USDC',
      action: 'ActionVault.splitInflow(20%, 30%, 50%)'
    },
    metrics: {
      cooldown: '3600s Guard',
    },
    nodesList: [
      { name: 'Inbound Transfer Listener', type: 'trigger', summary: 'Monitors USDC token incoming deposits' },
      { name: 'Threshold Qualifier', type: 'condition', summary: 'Checks minimum deposit size criteria' },
      { name: 'Three-Way Splitter Engine', type: 'action', summary: 'Executes DEX swap, Safe routing, and liquid balance retention' }
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
    description: 'Monitors rapid liquidity fluctuations on Unichain Sepolia and triggers an automated defensive hedge swap on Base Sepolia.',
    icon: Globe,
    tagColor: 'text-purple-300 border-purple-500/30 bg-purple-500/10',
    tags: ['Cross-Chain', 'Velocity Guard', 'Unichain <-> Base'],
    nodesCount: 4,
    flow: {
      trigger: 'Unichain Sync Event',
      condition: 'Drop > 5% in 10s',
      action: 'Base Vault Hedge Swap'
    },
    metrics: {
      cooldown: '600s Cooldown',
    },
    nodesList: [
      { name: 'Unichain Event Listener', type: 'trigger', summary: 'Cross-chain event ingestion from Unichain testnet' },
      { name: 'Velocity Drop Calculation', type: 'condition', summary: 'Tracks rolling delta over short block window' },
      { name: 'Base Vault Cross-Execution', type: 'action', summary: 'Fires callback to ActionVault on Base Sepolia' }
    ],
    rscSnippet: `// Multi-Network Reactive Bridge
if (velocityDrop > VELOCITY_LIMIT) {
    emit Callback(CHAIN_ID_BASE_SEPOLIA, baseVault, GAS_LIMIT, payload);
}`
  },
];

export default function TemplateLibraryPage() {
  const router = useRouter();
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

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
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
        const draft = await workspaceRequest<{ id: string }>(owner, '/pipeline/drafts', {
          method: 'POST', signal,
          body: JSON.stringify({ graph: { ...graph, metadata: { name: recipe.title, ownerAddress: owner } } }),
        });
        if (!signal.aborted) router.push('/workspace/studio?pipeline=' + encodeURIComponent(draft.id));
      } else {
        const id = crypto.randomUUID();
        saveBrowserDraft(id, recipe.title, graph, recipe.description);
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
        const matchesTag = r.tags.some(t => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesTag) return false;
      }
      return true;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="ws-page space-y-5">
      {creationError && <p role="alert" className="text-sm text-rose-300">{creationError}</p>}
      
      <WorkspacePageHeader
        title="Template Library"
        description="Battle-tested cross-chain automation blueprints ready to deploy into Pipeline Studio."
        icon={<Library className="size-4" />}
        actions={
          <Link href="/workspace/studio" className="ws-button ws-button-primary inline-flex items-center gap-1.5">
            <Zap className="size-3.5" />
            <span>Open Studio</span>
          </Link>
        }
      />

      {/* Filter Chips & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-[var(--ws-border)] bg-[var(--ws-panel)] p-2 sm:p-2.5">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
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
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  activeCategory === cat.id ? 'bg-[var(--ws-accent)]/20 text-[var(--ws-accent)]' : 'bg-white/[0.08] text-zinc-400'
                }`}
              >
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
            placeholder="Search templates..."
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

      {/* Streamlined Templates Grid */}
      {filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecipes.map((recipe) => {
            const Icon = recipe.icon;
            return (
              <div
                key={recipe.id}
                className="group flex flex-col justify-between rounded-xl border border-[var(--ws-border)] bg-[var(--ws-panel)] p-4 transition-all duration-150 hover:border-[var(--ws-accent)]/50 hover:bg-[#1a1d26]"
              >
                <div className="space-y-3">
                  {/* Card Header: Icon, Title, Category & Node Count */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-2 rounded-lg border ${recipe.tagColor} shrink-0`}>
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-white tracking-tight truncate group-hover:text-[var(--ws-accent)] transition-colors">
                          {recipe.title}
                        </h3>
                        <p className="text-[11px] text-[var(--ws-muted)] flex items-center gap-1.5 mt-0.5">
                          <span>{recipe.categoryLabel}</span>
                          <span>·</span>
                          <span className="font-mono tabular-nums">{recipe.nodesCount} nodes</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Concise Description */}
                  <p className="text-xs text-[var(--ws-muted)] leading-relaxed line-clamp-2 min-h-[2.5rem]">
                    {recipe.description}
                  </p>

                  {/* Minimal Core Logic Flow */}
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 py-1.5 px-2.5 rounded-lg bg-[#12141c] border border-white/[0.04]">
                    <span className="text-cyan-300 truncate max-w-[120px]" title={recipe.flow.trigger}>
                      {recipe.flow.trigger}
                    </span>
                    <ArrowRight className="size-2.5 text-zinc-600 shrink-0" />
                    <span className="text-emerald-300 truncate max-w-[130px]" title={recipe.flow.action}>
                      {recipe.flow.action}
                    </span>
                  </div>
                </div>

                {/* Card Actions: Primary Use Template + Secondary Preview */}
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
          title="No recipes found."
          description="No automation blueprints match your search criteria. Try clearing the search or switching category filters."
          icon={<Library className="size-6" />}
        />
      )}

      {/* Slide-Over Architecture Preview Drawer */}
      {inspectingRecipe && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-[#090a0f] border-l border-white/[0.12] shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#0e1017]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Library className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">
                    {inspectingRecipe.title}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.06] text-slate-300 border border-white/10">
                    {inspectingRecipe.nodesCount} Nodes
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {inspectingRecipe.categoryLabel}
                </p>
              </div>

              <button
                onClick={() => setInspectingRecipe(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {/* Description */}
              <div className="p-3.5 rounded-xl bg-[#12141c] border border-white/[0.08] text-slate-300 leading-relaxed">
                {inspectingRecipe.description}
              </div>

              {/* Node Breakdown */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
                  Graph Node Architecture
                </div>
                <div className="space-y-2">
                  {inspectingRecipe.nodesList.map((node, i) => (
                    <div key={i} className="p-3 rounded-xl bg-[#12141c] border border-white/[0.08] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{node.name}</span>
                        <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold border ${
                          node.type === 'trigger'
                            ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                            : node.type === 'condition'
                            ? 'bg-violet-500/10 text-violet-300 border-violet-500/20'
                            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                        }`}>
                          {node.type}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px]">{node.summary}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generated RSC Solidity Logic */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
                  Generated Reactive Smart Contract (RSC)
                </div>
                <div className="p-3.5 bg-[#06070a] rounded-xl border border-white/[0.08] overflow-x-auto text-[11px] font-mono text-cyan-300 leading-relaxed">
                  <pre>{inspectingRecipe.rscSnippet}</pre>
                </div>
              </div>

              {/* Security Invariants Callout */}
              <div className="p-3.5 ws-panel space-y-1">
                <div className="text-[11px] font-mono font-semibold text-violet-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
                  <span>Execution checks</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Check the deployed contract for the callback permissions, cooldown and price checks it supports.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/[0.08] bg-[#0e1017] flex items-center justify-between gap-3">
              <button
                onClick={() => setInspectingRecipe(null)}
                className="px-4 py-2 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-white font-medium transition-colors"
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
