export type VisualNodeState =
  | 'IDLE'
  | 'CONFIGURED'
  | 'CHECKING'
  | 'LISTENING'
  | 'EVENT_CAPTURED'
  | 'EVALUATING'
  | 'CONDITION_MET'
  | 'FIRING_CALLBACK'
  | 'SUCCESS'
  | 'COOLDOWN'
  | 'REVERTED';

export type NodeCategory = 'trigger' | 'condition' | 'action' | 'logic';

export interface BaseNodeData {
  label: string;
  category: NodeCategory;
  state?: VisualNodeState;
  statusMessage?: string;
  lastRunTimestamp?: number;
  warning?: string | null;
  isOrphan?: boolean;
  [key: string]: any;
}

// 1. Trigger Data Types
export interface WatchDEXPriceData extends BaseNodeData {
  category: 'trigger';
  chainId: number;
  dexRouter: string;
  pairLabel: string;
  pairAddress: string;
}

export interface WatchTransfersData extends BaseNodeData {
  category: 'trigger';
  targetWallet: string;
  tokenAddress: string;
  direction: 'Incoming' | 'Outgoing' | 'Both';
}

export interface PeriodicCronData extends BaseNodeData {
  category: 'trigger';
  intervalValue: number;
  intervalUnit: 'Minutes' | 'Hours' | 'Days';
}

export interface CustomEventWatcherData extends BaseNodeData {
  category: 'trigger';
  chainId: number;
  contractAddress: string;
  eventName: string;
  topic0?: string;
}

// 2. Condition Data Types
export interface PriceThresholdGuardData extends BaseNodeData {
  category: 'condition';
  operator: 'LESS_THAN_OR_EQUAL' | 'GREATER_THAN_OR_EQUAL';
  thresholdPriceUSD: number;
}

export interface CooldownGuardData extends BaseNodeData {
  category: 'condition';
  cooldownSeconds: number;
  timeUnit: 'Seconds' | 'Minutes' | 'Hours';
}

export interface BalanceThresholdData extends BaseNodeData {
  category: 'condition';
  targetAccount: 'ActionVault' | 'ConnectedWallet';
  comparison: 'Above' | 'Below';
  thresholdAmount: number;
}

export interface PriceVelocityGuardData extends BaseNodeData {
  category: 'condition';
  velocityThresholdBps: number; // e.g. 500 = 5%
  windowSeconds: number; // e.g. 10s
  direction: 'DROP' | 'SURGE';
}

// 3. Action Data Types
export interface DEXSwapData extends BaseNodeData {
  category: 'action';
  fromToken: string;
  toToken: string;
  amountPercentage: number;
  maxSlippagePercent: number;
  actionVaultAddress?: string;
}

export interface EmergencySafeSweepData extends BaseNodeData {
  category: 'action';
  safeAddress: string;
  assetScope: 'ALL' | 'ETH_ONLY';
}

export interface NotifyLogWebhookData extends BaseNodeData {
  category: 'action';
  alertTitle: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

// 4. Logic Gate Data Types
export interface LogicGateData extends BaseNodeData {
  category: 'logic';
  gateType: 'AND' | 'OR';
}
