'use client';

import React, { useState, useMemo } from 'react';
import { 
  TrendingDown, 
  ArrowLeftRight, 
  Clock, 
  Target, 
  Hourglass, 
  Coins, 
  ArrowDownRight, 
  ShieldCheck, 
  Bell, 
  GitMerge,
  Search,
  GripVertical,
  Plus,
  Radio,
  Activity,
  Layers,
  PanelLeftClose,
  X
} from 'lucide-react';
import { NodeCategory } from '@/types/canvas';
import { cn } from '@/lib/utils';

interface PaletteItem {
  type: string;
  category: NodeCategory;
  name: string;
  description: string;
  icon: React.ReactNode;
  defaultData: Record<string, any>;
}

export const PALETTE_ITEMS: PaletteItem[] = [
  // 1. Triggers
  {
    type: 'watchDEXPrice',
    category: 'trigger',
    name: 'Watch DEX Price',
    description: 'Listen to Sync events on Uniswap V2 pair',
    icon: <TrendingDown className="w-4 h-4 text-cyan-400" />,
    defaultData: {
      label: 'Watch DEX Price',
      category: 'trigger',
      state: 'LISTENING',
      pairLabel: 'ETH / USDC',
      dexRouter: 'Uniswap V2',
      chainId: 84532,
      pairAddress: '',
    },
  },
  {
    type: 'watchTransfers',
    category: 'trigger',
    name: 'Watch Transfers',
    description: 'Monitor wallet or token transfer streams',
    icon: <ArrowLeftRight className="w-4 h-4 text-cyan-400" />,
    defaultData: {
      label: 'Watch Transfers',
      category: 'trigger',
      state: 'IDLE',
      targetWallet: 'Connected Wallet',
      tokenAddress: 'Native ETH',
      direction: 'Outgoing',
    },
  },
  {
    type: 'periodicCron',
    category: 'trigger',
    name: 'Periodic Cron',
    description: 'Reactive block interval tick scheduler',
    icon: <Clock className="w-4 h-4 text-cyan-400" />,
    defaultData: {
      label: 'Periodic Cron',
      category: 'trigger',
      state: 'IDLE',
      intervalValue: 1,
      intervalUnit: 'Hours',
    },
  },
  {
    type: 'customEventWatcher',
    category: 'trigger',
    name: 'Custom Event Watcher',
    description: 'Listen to any smart contract topic_0 (Node #11)',
    icon: <Radio className="w-4 h-4 text-cyan-400" />,
    defaultData: {
      label: 'Custom Event Watcher',
      category: 'trigger',
      state: 'LISTENING',
      chainId: 84532,
      contractAddress: '',
      eventName: 'Sync(uint112,uint112)',
      topic0: '0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1',
    },
  },

  // 2. Conditions
  {
    type: 'priceThresholdGuard',
    category: 'condition',
    name: 'Price Threshold Guard',
    description: 'Stop-Loss or Take-Profit price check',
    icon: <Target className="w-4 h-4 text-amber-400" />,
    defaultData: {
      label: 'Price Threshold Guard',
      category: 'condition',
      state: 'CONFIGURED',
      operator: 'LESS_THAN_OR_EQUAL',
      thresholdPriceUSD: 1800,
    },
  },
  {
    type: 'cooldownGuard',
    category: 'condition',
    name: 'Cooldown Rate-Limiter',
    description: 'Prevent multi-callback rapid block storms',
    icon: <Hourglass className="w-4 h-4 text-amber-400" />,
    defaultData: {
      label: 'Cooldown Rate-Limiter',
      category: 'condition',
      state: 'CONFIGURED',
      cooldownSeconds: 300,
      timeUnit: 'Minutes',
    },
  },
  {
    type: 'balanceThreshold',
    category: 'condition',
    name: 'Balance Threshold',
    description: 'Verify minimum vault solvency',
    icon: <Coins className="w-4 h-4 text-amber-400" />,
    defaultData: {
      label: 'Balance Threshold',
      category: 'condition',
      state: 'IDLE',
      targetAccount: 'ActionVault',
      comparison: 'Above',
      thresholdAmount: 0.05,
    },
  },
  {
    type: 'priceVelocityGuard',
    category: 'condition',
    name: 'Price Velocity Guard',
    description: 'Detect rapid flash crash drops within seconds (Node #14)',
    icon: <Activity className="w-4 h-4 text-amber-400" />,
    defaultData: {
      label: 'Price Velocity Guard',
      category: 'condition',
      state: 'CONFIGURED',
      velocityThresholdBps: 500,
      windowSeconds: 10,
      direction: 'DROP',
    },
  },

  // 3. Actions
  {
    type: 'dexSwap',
    category: 'action',
    name: 'DEX Token Swap',
    description: 'Trigger Uniswap liquidation via ActionVault',
    icon: <ArrowDownRight className="w-4 h-4 text-emerald-400" />,
    defaultData: {
      label: 'DEX Token Swap',
      category: 'action',
      state: 'CONFIGURED',
      fromToken: 'ETH',
      toToken: 'USDC',
      amountPercentage: 50,
      maxSlippagePercent: 5,
      actionVaultAddress: '',
    },
  },
  {
    type: 'emergencySafeSweep',
    category: 'action',
    name: 'Emergency SafeSweep',
    description: 'Evacuate 100% assets to cold safe address',
    icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
    defaultData: {
      label: 'Emergency SafeSweep',
      category: 'action',
      state: 'IDLE',
      safeAddress: '',
      assetScope: 'ALL',
    },
  },
  {
    type: 'notifyLogWebhook',
    category: 'action',
    name: 'Notify Log Webhook',
    description: 'Emit zero-gas notification event on-chain',
    icon: <Bell className="w-4 h-4 text-emerald-400" />,
    defaultData: {
      label: 'Notify Log Webhook',
      category: 'action',
      state: 'IDLE',
      alertTitle: 'Whale Volatility Detected',
      severity: 'WARNING',
    },
  },

  // 4. Logic Gate
  {
    type: 'logicGate',
    category: 'logic',
    name: 'Logic Gate (AND / OR)',
    description: 'Evaluate multi-signal condition branches',
    icon: <GitMerge className="w-4 h-4 text-purple-400" />,
    defaultData: {
      label: 'Logic Gate (AND)',
      category: 'logic',
      state: 'IDLE',
      gateType: 'AND',
    },
  },
];

interface NodePaletteProps {
  onAddNode: (type: string, data: Record<string, any>) => void;
  onClose?: () => void;
}

type TabType = 'all' | NodeCategory;

const TABS: { id: TabType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'trigger', label: 'Trigger' },
  { id: 'condition', label: 'Condition' },
  { id: 'action', label: 'Action' },
  { id: 'logic', label: 'Logic' },
];

export function NodePalette({ onAddNode, onClose }: NodePaletteProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [search, setSearch] = useState('');

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: PALETTE_ITEMS.length };
    PALETTE_ITEMS.forEach((item) => {
      c[item.category] = (c[item.category] || 0) + 1;
    });
    return c;
  }, []);

  const filteredItems = PALETTE_ITEMS.filter((item) => {
    const matchesTab = activeTab === 'all' || item.category === activeTab;
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const onDragStart = (event: React.DragEvent, item: PaletteItem) => {
    event.dataTransfer.setData('application/reactflow/type', item.type);
    event.dataTransfer.setData('application/reactflow/data', JSON.stringify(item.defaultData));
    event.dataTransfer.effectAllowed = 'move';
  };

  const CATEGORY_STRIPES: Record<NodeCategory, string> = {
    trigger: 'border-l-2 border-l-cyan-400 hover:border-l-cyan-300',
    condition: 'border-l-2 border-l-amber-400 hover:border-l-amber-300',
    action: 'border-l-2 border-l-emerald-400 hover:border-l-emerald-300',
    logic: 'border-l-2 border-l-purple-400 hover:border-l-purple-300',
  };

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col border-r border-[var(--ws-border)] bg-[var(--ws-rail)]">
      {/* Palette Header */}
      <div className="p-3.5 border-b border-[var(--ws-border)] bg-[var(--ws-rail)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="grid size-6 place-items-center rounded-md bg-[var(--ws-accent)]/10 text-[var(--ws-accent)]">
              <Layers className="size-3.5" />
            </span>
            <span className="text-xs font-bold text-white tracking-tight truncate">
              Node Catalog
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/[0.08] text-[var(--ws-muted)] border border-white/10 font-semibold shrink-0">
              {PALETTE_ITEMS.length}
            </span>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="grid size-7 place-items-center rounded-md text-[var(--ws-muted)] hover:bg-white/10 hover:text-white transition-colors cursor-pointer shrink-0"
              title="Close Node Catalog"
              aria-label="Close Node Catalog"
            >
              <PanelLeftClose size={15} />
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--ws-muted)]" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--ws-panel)] border border-[var(--ws-border)] rounded-lg pl-8 pr-8 py-1.5 text-xs text-[var(--ws-text)] placeholder-[var(--ws-muted)]/60 focus:outline-none focus:border-[var(--ws-accent)] transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2 text-[var(--ws-muted)] hover:text-white"
              title="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar p-1 bg-[var(--ws-panel)] rounded-lg border border-[var(--ws-border)] text-[11px]">
          {TABS.map((tab) => {
            const count = counts[tab.id] ?? 0;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 min-w-max py-1 px-1.5 text-center rounded-md font-medium transition-all cursor-pointer text-[11px] flex items-center justify-center gap-1',
                  isActive
                    ? 'bg-[var(--ws-accent-bg)] text-[var(--ws-accent)] font-semibold border border-[var(--ws-accent)]/30 shadow-sm'
                    : 'text-[var(--ws-muted)] hover:text-white hover:bg-white/5'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'text-[9px] font-mono px-1 rounded',
                    isActive ? 'bg-[var(--ws-accent)]/20 text-[var(--ws-accent)]' : 'text-[var(--ws-muted)]/60'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Nodes List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {filteredItems.map((item) => {
          const badgeColor =
            item.category === 'trigger'
              ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/25'
              : item.category === 'condition'
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/25'
              : item.category === 'action'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
              : 'bg-purple-500/10 text-purple-300 border-purple-500/25';

          const borderHover =
            item.category === 'trigger'
              ? 'hover:border-cyan-500/40'
              : item.category === 'condition'
              ? 'hover:border-amber-500/40'
              : item.category === 'action'
              ? 'hover:border-emerald-500/40'
              : 'hover:border-purple-500/40';

          return (
            <div
              key={item.type}
              draggable
              onDragStart={(e) => onDragStart(e, item)}
              onClick={() => onAddNode(item.type, item.defaultData)}
              className={cn(
                'group relative p-2.5 rounded-xl border border-[var(--ws-border)] bg-[var(--ws-panel)] hover:bg-[#1e222c] hover:shadow-md cursor-grab active:cursor-grabbing transition-all duration-150 flex items-start gap-2.5 select-none',
                CATEGORY_STRIPES[item.category],
                borderHover
              )}
            >
              <div className="p-2 rounded-lg border border-white/[0.08] bg-black/40 group-hover:border-white/20 transition-colors shrink-0">
                {item.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-xs font-semibold text-white group-hover:text-white transition-colors truncate">
                    {item.name}
                  </span>
                  <span className={cn('text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border font-semibold shrink-0', badgeColor)}>
                    {item.category}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--ws-muted)] line-clamp-1 mt-0.5">
                  {item.description}
                </p>
              </div>

              <div className="flex items-center gap-1 self-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Plus className="size-3.5 text-[var(--ws-accent)]" />
                <GripVertical className="size-3 text-[var(--ws-muted)]" />
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-xs text-[var(--ws-muted)]">
            No matching nodes found.
          </div>
        )}
      </div>

      {/* Footer Instruction */}
      <div className="p-2.5 border-t border-[var(--ws-border)] text-[11px] text-[var(--ws-muted)] text-center bg-[var(--ws-rail)]">
        Drag & drop or click to add
      </div>
    </div>
  );
}
