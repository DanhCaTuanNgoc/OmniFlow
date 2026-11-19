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
  status: 'SUCCESS' | 'SKIPPED' | 'FAILED';
  details: {
    tokenPair?: string;
    triggerPrice?: string;
    executedPrice?: string;
    amountIn?: string;
    amountOut?: string;
    reason?: string;
  };
}
