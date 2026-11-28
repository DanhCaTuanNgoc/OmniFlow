import { Node, Edge } from '@xyflow/react';
import { CONTRACT_ADDRESSES } from './constants';

export interface RecipePreset {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  nodesCount: number;
  badge: string;
  nodes: Node[];
  edges: Edge[];
}

export const RECIPE_PRESETS: Record<string, RecipePreset> = {
  'stop-loss': {
    id: 'stop-loss',
    title: 'Flash Crash Stop-Loss',
    description:
      'Listen to DEX Uniswap pair on Base Sepolia. If ETH drops <= $1,800 USD, swap 50% Vault ETH into USDC via ActionVault.',
    category: 'DeFi Risk',
    tags: ['DeFi Risk', 'Uniswap V2', 'Base Sepolia'],
    nodesCount: 4,
    badge: 'FLAGSHIP',
    nodes: [
      {
        id: 'trigger-1',
        type: 'watchDEXPrice',
        position: { x: 40, y: 150 },
        data: {
          label: 'Watch DEX Price',
          category: 'trigger',
          state: 'LISTENING',
          pairLabel: 'ETH / USDC',
          dexRouter: 'Uniswap V2',
          chainId: 84532,
          pairAddress: CONTRACT_ADDRESSES.DEFAULT_PAIR_ETH_USDC,
        },
      },
      {
        id: 'condition-1',
        type: 'priceThresholdGuard',
        position: { x: 380, y: 150 },
        data: {
          label: 'Price Threshold Guard',
          category: 'condition',
          state: 'CONFIGURED',
          operator: 'LESS_THAN_OR_EQUAL',
          thresholdPriceUSD: 1800,
        },
      },
      {
        id: 'condition-2',
        type: 'cooldownGuard',
        position: { x: 720, y: 150 },
        data: {
          label: 'Cooldown Rate-Limiter',
          category: 'condition',
          state: 'CONFIGURED',
          cooldownSeconds: 300,
        },
      },
      {
        id: 'action-1',
        type: 'dexSwap',
        position: { x: 1060, y: 150 },
        data: {
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
    ],
    edges: [
      {
        id: 'e-trigger-cond1',
        source: 'trigger-1',
        target: 'condition-1',
        type: 'custom',
        data: { color: '#38bdf8' },
      },
      {
        id: 'e-cond1-cond2',
        source: 'condition-1',
        target: 'condition-2',
        type: 'custom',
        data: { color: '#fbbf24' },
      },
      {
        id: 'e-cond2-act1',
        source: 'condition-2',
        target: 'action-1',
        type: 'custom',
        data: { color: '#34d399' },
      },
    ],
  },

  'take-profit': {
    id: 'take-profit',
    title: 'Take-Profit Scalper',
    description:
      'When ETH reaches $2,800, sell 50% of the Vault balance if the price still qualifies at settlement.',
    category: 'Profit Taking',
    tags: ['Profit Taking', 'AMM Sync', 'Rate-Limited'],
    nodesCount: 4,
    badge: 'POPULAR',
    nodes: [
      {
        id: 'trigger-1',
        type: 'watchDEXPrice',
        position: { x: 40, y: 150 },
        data: {
          label: 'Watch DEX Price',
          category: 'trigger',
          state: 'LISTENING',
          pairLabel: 'ETH / USDC',
          dexRouter: 'Uniswap V2',
          chainId: 84532,
          pairAddress: CONTRACT_ADDRESSES.DEFAULT_PAIR_ETH_USDC,
        },
      },
      {
        id: 'condition-1',
        type: 'priceThresholdGuard',
        position: { x: 380, y: 150 },
        data: {
          label: 'Price Threshold Guard',
          category: 'condition',
          state: 'CONFIGURED',
          operator: 'GREATER_THAN_OR_EQUAL',
          thresholdPriceUSD: 2800,
        },
      },
      {
        id: 'condition-2',
        type: 'cooldownGuard',
        position: { x: 720, y: 150 },
        data: {
          label: 'Cooldown Rate-Limiter',
          category: 'condition',
          state: 'CONFIGURED',
          cooldownSeconds: 600,
        },
      },
      {
        id: 'action-1',
        type: 'dexSwap',
        position: { x: 1060, y: 150 },
        data: {
          label: 'DEX Profit Take',
          category: 'action',
          state: 'CONFIGURED',
          fromToken: 'ETH',
          toToken: 'USDC',
          amountPercentage: 50,
          maxSlippagePercent: 5,
          actionVaultAddress: '',
        },
      },
    ],
    edges: [
      {
        id: 'e-trigger-cond1',
        source: 'trigger-1',
        target: 'condition-1',
        type: 'custom',
        data: { color: '#38bdf8' },
      },
      {
        id: 'e-cond1-cond2',
        source: 'condition-1',
        target: 'condition-2',
        type: 'custom',
        data: { color: '#fbbf24' },
      },
      {
        id: 'e-cond2-act1',
        source: 'condition-2',
        target: 'action-1',
        type: 'custom',
        data: { color: '#34d399' },
      },
    ],
  },

  'anti-drainer': {
    id: 'anti-drainer',
    title: 'Anti-Drainer Cold Vault SafeSweep',
    description:
      'If unauthorized outgoing transfers exceed 1.0 ETH, instantly sweep 100% of Vault ETH and ERC-20 assets to cold storage.',
    category: 'Security',
    tags: ['Anti-Phishing', '1-Tx Evacuation', 'Cold Vault'],
    nodesCount: 3,
    badge: 'SECURITY',
    nodes: [
      {
        id: 'trigger-1',
        type: 'watchTransfers',
        position: { x: 40, y: 150 },
        data: {
          label: 'Watch Transfers',
          category: 'trigger',
          state: 'IDLE',
          targetWallet: CONTRACT_ADDRESSES.DEFAULT_ACTION_VAULT,
          tokenAddress: 'Native ETH',
          direction: 'Outgoing',
        },
      },
      {
        id: 'condition-1',
        type: 'cooldownGuard',
        position: { x: 420, y: 150 },
        data: {
          label: 'Cooldown Rate-Limiter',
          category: 'condition',
          state: 'CONFIGURED',
          cooldownSeconds: 60,
        },
      },
      {
        id: 'action-1',
        type: 'emergencySafeSweep',
        position: { x: 800, y: 150 },
        data: {
          label: 'Emergency SafeSweep',
          category: 'action',
          state: 'CONFIGURED',
          safeAddress: CONTRACT_ADDRESSES.DEFAULT_BACKUP_SAFE_SWEEP,
          assetScope: 'ALL',
        },
      },
    ],
    edges: [
      {
        id: 'e-trigger-cond1',
        source: 'trigger-1',
        target: 'condition-1',
        type: 'custom',
        data: { color: '#38bdf8' },
      },
      {
        id: 'e-cond1-act1',
        source: 'condition-1',
        target: 'action-1',
        type: 'custom',
        data: { color: '#34d399' },
      },
    ],
  },

  'cron-rebalance': {
    id: 'cron-rebalance',
    title: 'Daily Autonomous Rebalancer',
    description:
      'Trigger periodic Cron tick every 24 hours via ReactVM system block intervals to check collateral and balance assets.',
    category: 'Cron / Keeper',
    tags: ['Cron Tick', 'Zero Server', 'Reactive Core'],
    nodesCount: 3,
    badge: 'SERVERLESS',
    nodes: [
      {
        id: 'trigger-1',
        type: 'periodicCron',
        position: { x: 40, y: 150 },
        data: {
          label: 'Periodic Cron (24h)',
          category: 'trigger',
          state: 'IDLE',
          intervalValue: 24,
          intervalUnit: 'Hours',
        },
      },
      {
        id: 'condition-1',
        type: 'balanceThreshold',
        position: { x: 420, y: 150 },
        data: {
          label: 'Solvency Check',
          category: 'condition',
          state: 'IDLE',
          targetAccount: 'ActionVault',
          comparison: 'Above',
          thresholdAmount: 0.1,
        },
      },
      {
        id: 'action-1',
        type: 'dexSwap',
        position: { x: 800, y: 150 },
        data: {
          label: 'Rebalance Swap',
          category: 'action',
          state: 'CONFIGURED',
          fromToken: 'ETH',
          toToken: 'USDC',
          amountPercentage: 10,
          maxSlippagePercent: 1,
          actionVaultAddress: '',
        },
      },
    ],
    edges: [
      {
        id: 'e-trigger-cond1',
        source: 'trigger-1',
        target: 'condition-1',
        type: 'custom',
        data: { color: '#38bdf8' },
      },
      {
        id: 'e-cond1-act1',
        source: 'condition-1',
        target: 'action-1',
        type: 'custom',
        data: { color: '#34d399' },
      },
    ],
  },

  'payday-splitter': {
    id: 'payday-splitter',
    title: 'Payday Auto-Splitter (Income DCA)',
    description:
      'Upon incoming salary transfer (> 1,000 USDC), autonomously split: DCA 20% into ETH, sweep 30% to Cold Savings, keep 50% liquid.',
    category: 'Asset Management',
    tags: ['Salary Split', 'Multi-Signal', 'Non-Custodial'],
    nodesCount: 5,
    badge: 'HACKATHON EXCLUSIVE',
    nodes: [
      {
        id: 'trigger-1',
        type: 'watchTransfers',
        position: { x: 40, y: 210 },
        data: {
          label: 'Salary Transfer Watcher',
          category: 'trigger',
          state: 'IDLE',
          targetWallet: 'Connected Wallet',
          tokenAddress: 'USDC',
          direction: 'Incoming',
        },
      },
      {
        id: 'condition-1',
        type: 'balanceThreshold',
        position: { x: 390, y: 210 },
        data: {
          label: 'Salary > 1,000 USDC',
          category: 'condition',
          state: 'IDLE',
          targetAccount: 'ConnectedWallet',
          comparison: 'Above',
          thresholdAmount: 1000,
        },
      },
      {
        id: 'action-1',
        type: 'dexSwap',
        position: { x: 760, y: 20 },
        data: {
          label: 'DCA 20% into ETH',
          category: 'action',
          state: 'CONFIGURED',
          fromToken: 'USDC',
          toToken: 'ETH',
          amountPercentage: 20,
          maxSlippagePercent: 1,
          actionVaultAddress: '',
        },
      },
      {
        id: 'action-2',
        type: 'emergencySafeSweep',
        position: { x: 760, y: 230 },
        data: {
          label: 'Sweep 30% to Cold Safe',
          category: 'action',
          state: 'CONFIGURED',
          safeAddress: CONTRACT_ADDRESSES.DEFAULT_BACKUP_SAFE_SWEEP,
          assetScope: 'ALL',
        },
      },
      {
        id: 'action-3',
        type: 'notifyLogWebhook',
        position: { x: 760, y: 420 },
        data: {
          label: 'Telegram Alert',
          category: 'action',
          state: 'CONFIGURED',
          alertTitle: 'Payday Splitter: 20% DCA + 30% Cold Sweep Executed',
          severity: 'INFO',
        },
      },
    ],
    edges: [
      {
        id: 'e-trig-cond1',
        source: 'trigger-1',
        target: 'condition-1',
        type: 'custom',
        data: { color: '#38bdf8' },
      },
      {
        id: 'e-cond1-act1',
        source: 'condition-1',
        target: 'action-1',
        type: 'custom',
        data: { color: '#34d399' },
      },
      {
        id: 'e-cond1-act2',
        source: 'condition-1',
        target: 'action-2',
        type: 'custom',
        data: { color: '#34d399' },
      },
      {
        id: 'e-cond1-act3',
        source: 'condition-1',
        target: 'action-3',
        type: 'custom',
        data: { color: '#34d399' },
      },
    ],
  },

  'cross-chain-hedge': {
    id: 'cross-chain-hedge',
    title: 'Unichain-to-Base Cross-Chain Hedge',
    description:
      'Watch Unichain Sepolia for a price drop of at least 5% within 10 seconds and settle on Base Sepolia.',
    category: 'Cross-Chain',
    tags: ['Cross-Chain', 'Velocity Guard', 'Unichain <-> Base'],
    nodesCount: 4,
    badge: 'CROSS-CHAIN',
    nodes: [
      {
        id: 'trigger-1',
        type: 'watchDEXPrice',
        position: { x: 40, y: 150 },
        data: {
          label: 'Watch DEX Unichain',
          category: 'trigger',
          state: 'LISTENING',
          pairLabel: 'ETH / USDC',
          dexRouter: 'Uniswap V2 (Unichain)',
          chainId: 1301,
          pairAddress: '',
        },
      },
      {
        id: 'condition-1',
        type: 'priceVelocityGuard',
        position: { x: 400, y: 150 },
        data: {
          label: 'Price Velocity Guard',
          category: 'condition',
          state: 'CONFIGURED',
          velocityThresholdBps: 500,
          windowSeconds: 10,
          direction: 'DROP',
        },
      },
      {
        id: 'condition-2',
        type: 'cooldownGuard',
        position: { x: 740, y: 150 },
        data: {
          label: 'Cooldown Rate-Limiter',
          category: 'condition',
          state: 'CONFIGURED',
          cooldownSeconds: 300,
        },
      },
      {
        id: 'action-1',
        type: 'dexSwap',
        position: { x: 1080, y: 150 },
        data: {
          label: 'Base Sepolia Swap',
          category: 'action',
          state: 'CONFIGURED',
          fromToken: 'ETH',
          toToken: 'USDC',
          amountPercentage: 50,
          maxSlippagePercent: 5,
          actionVaultAddress: '',
          destinationPoolAddress: '',
        },
      },
    ],
    edges: [
      {
        id: 'e-trigger-cond1',
        source: 'trigger-1',
        target: 'condition-1',
        type: 'custom',
        data: { color: '#c084fc', crossChainLabel: 'Cross-Chain: Unichain -> Base' },
      },
      {
        id: 'e-cond1-cond2',
        source: 'condition-1',
        target: 'condition-2',
        type: 'custom',
        data: { color: '#fbbf24' },
      },
      {
        id: 'e-cond2-act1',
        source: 'condition-2',
        target: 'action-1',
        type: 'custom',
        data: { color: '#34d399' },
      },
    ],
  },
};
