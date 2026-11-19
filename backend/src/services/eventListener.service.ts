import type { ActivityLogEntry } from '../data/activityLog.js';
import type { WebSocketGateway } from '../websocket/gateway.js';

export class EventListenerService {
  private logsBuffer: ActivityLogEntry[] = [];
  private readonly maxBufferSize = 50;
  private wsGateway?: WebSocketGateway;

  constructor(wsGateway?: WebSocketGateway) {
    this.wsGateway = wsGateway;
  }

  public setWebSocketGateway(wsGateway: WebSocketGateway): void {
    this.wsGateway = wsGateway;
  }

  /**
   * Thêm một log entry mới vào buffer (vòng xoay FIFO max 50) và broadcast qua WebSocket
   */
  public addLog(entry: ActivityLogEntry): void {
    this.logsBuffer.unshift(entry);
    if (this.logsBuffer.length > this.maxBufferSize) {
      this.logsBuffer.pop();
    }

    if (this.wsGateway) {
      this.wsGateway.broadcast({
        type: 'REACTIVE_STEP_UPDATE',
        pipelineId: entry.pipelineId,
        timestamp: entry.timestamp,
        data: {
          step: entry.status === 'SUCCESS' ? 'DESTINATION_EXECUTED' : 'SKIPPED',
          currentPrice: entry.details.executedPrice,
          originTxHash: entry.originTxHash,
          rscTxHash: entry.reactiveTxHash,
          destTxHash: entry.destinationTxHash,
          latencyMs: entry.reactiveLatencyMs,
          reason: entry.details.reason,
        },
      });
    }
  }

  /**
   * Lấy toàn bộ danh sách logs hiện có
   */
  public getLogs(pipelineId?: string): ActivityLogEntry[] {
    if (!pipelineId) return this.logsBuffer;
    return this.logsBuffer.filter((log) => log.pipelineId === pipelineId);
  }
}

export const eventListenerService = new EventListenerService();
