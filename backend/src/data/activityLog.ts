export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  pipelineId: string;
  pipelineName: string;
  originChainId: number;
  originTxHash: string;
  originBlock: number;
  originEvent: string;
  reactiveChainId: number;
  reactiveTxHash?: string;
  reactiveLatencyMs?: number;
  destinationChainId: number;
  destinationTxHash?: string;
  destinationAction: string;
  status: 'PENDING' | 'UNVERIFIED' | 'REORGED' | 'SUCCESS' | 'SKIPPED' | 'FAILED';
  originLogIndex: number;
  originBlockHash: string;
  reactiveBlockHash: string;
  destinationBlockHash?: string;
  details: {
    tokenPair?: string;
    executionId?: string;
    triggerPrice?: string;
    executedPrice?: string;
    amountIn?: string;
    amountOut?: string;
    reason?: string;
    correlation?: 'system' | 'receipt-window';
  };
}

export type PendingExecution = {
  deploymentId: string;
  reactiveTxHash: `0x${string}`;
  originTxHash: `0x${string}`;
  originLogIndex: number;
  conflictingReaction?: boolean;
};
