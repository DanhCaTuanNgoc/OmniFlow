'use client';

import React, { useState } from 'react';
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
  Plus
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

const PALETTE_ITEMS: PaletteItem[] = [
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
      pairAddress: '0x1234567890123456789012345678901234567890',
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
      maxSlippagePercent: 1,
      actionVaultAddress: '0xABCDEF0123456789ABCDEF0123456789ABCDEF01',
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
      safeAddress: '0x000000000000000000000000000000000000bEEF',
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
}

export function NodePalette({ onAddNode }: NodePaletteProps) {
  const [activeTab, setActiveTab] = useState<'all' | NodeCategory>('all');
  const [search, setSearch] = useState('');

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
    <div className="w-72 border-r border-white/[0.08] bg-[#0E1017]/90 backdrop-blur-2xl flex flex-col h-full z-10 select-none shadow-xl">
      {/* Palette Header */}
      <div className="p-4 border-b border-white/[0.06] bg-[#07080D]/60 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white tracking-wide">
            Node Catalog
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950/70 border border-purple-800/50 text-purple-300 font-semibold">
            10 Nodes
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#131620] border border-white/[0.08] rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>

        {/* Category Filter Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-[#131620] rounded-xl border border-white/[0.06] text-[11px]">
          {(['all', 'trigger', 'condition', 'action'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'py-1 text-center rounded-lg capitalize font-medium transition-all cursor-pointer',
                activeTab === tab
                  ? 'bg-white/10 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              {tab === 'all' ? 'All' : tab.slice(0, 4)}
            </button>
          ))}
        </div>
      </div>

      {/* Nodes List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredItems.map((item) => (
          <div
            key={item.type}
            draggable
            onDragStart={(e) => onDragStart(e, item)}
            onClick={() => onAddNode(item.type, item.defaultData)}
            className={cn(
              'group relative p-2.5 rounded-xl border border-white/[0.06] bg-[#11141E]/90 hover:bg-[#161B26] hover:border-white/[0.15] cursor-grab active:cursor-grabbing transition-all duration-150 flex items-start gap-2.5 shadow-sm',
              CATEGORY_STRIPES[item.category]
            )}
          >
            <div className="p-2 rounded-xl border border-white/[0.06] bg-[#0A0C12] group-hover:border-white/[0.15] transition-colors">
              {item.icon}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-100 group-hover:text-white transition-colors truncate">
                  {item.name}
                </span>
                <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                {item.description}
              </p>
            </div>

            <GripVertical className="w-3.5 h-3.5 text-slate-600 self-center opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-500">
            No matching nodes found.
          </div>
        )}
      </div>

      {/* Footer Instruction */}
      <div className="p-3 border-t border-white/[0.06] text-[11px] text-slate-500 text-center bg-[#07080D]/60">
        Drag & drop or click to add
      </div>
    </div>
  );
}
