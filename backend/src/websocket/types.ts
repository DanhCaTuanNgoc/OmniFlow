export type WebSocketEventType =
  | 'CONNECTED'
  | 'AUTHENTICATE'
  | 'AUTHENTICATED'
  | 'EXECUTION_UPDATED'
  | 'HEARTBEAT'
  | 'REACTIVE_STEP_UPDATE'
  | 'PIPELINE_STATUS_CHANGED'
  | 'SUBSCRIBE_PIPELINE'
  | 'UNSUBSCRIBE_PIPELINE'
  | 'ERROR';

export interface WebSocketMessage<T = unknown> {
  type: WebSocketEventType;
  pipelineId?: string;
  timestamp: string;
  data?: T;
}

export interface ReactiveStepData {
  step: 'TRIGGER_DETECTED' | 'CONDITION_EVALUATED' | 'CALLBACK_EMITTED' | 'DESTINATION_EXECUTED' | 'SKIPPED';
  currentPrice?: string;
  thresholdPrice?: string;
  originTxHash?: string;
  rscTxHash?: string;
  destTxHash?: string;
  latencyMs?: number;
  reason?: string;
  visualEffect?: {
    nodeId?: string;
    glowColor?: string;
    firePulseEdge?: string;
  };
}
