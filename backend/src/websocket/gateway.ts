import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type { WebSocketMessage } from './types.js';

interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean;
  subscribedPipelines: Set<string>;
}

export class WebSocketGateway {
  private wss: WebSocketServer;
  private heartbeatInterval?: NodeJS.Timeout;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/stream' });
    this.setupListeners();
    this.setupHeartbeat();
  }

  private setupListeners(): void {
    this.wss.on('connection', (ws: ExtendedWebSocket) => {
      ws.isAlive = true;
      ws.subscribedPipelines = new Set();

      console.log(`🔌 New WebSocket client connected (active: ${this.wss.clients.size})`);

      // Gửi thông điệp chào mừng
      this.sendToClient(ws, {
        type: 'CONNECTED',
        timestamp: new Date().toISOString(),
        data: { message: 'Connected to OmniFlow Event Stream' },
      });

      // Lắng nghe Pong
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      // Lắng nghe tin nhắn từ client (ví dụ subscribe pipeline cụ thể)
      ws.on('message', (rawMessage: string) => {
        try {
          const parsed: WebSocketMessage = JSON.parse(rawMessage.toString());
          if (parsed.type === 'SUBSCRIBE_PIPELINE' && parsed.pipelineId) {
            ws.subscribedPipelines.add(parsed.pipelineId);
            this.sendToClient(ws, {
              type: 'PIPELINE_STATUS_CHANGED',
              pipelineId: parsed.pipelineId,
              timestamp: new Date().toISOString(),
              data: { subscribed: true },
            });
          } else if (parsed.type === 'UNSUBSCRIBE_PIPELINE' && parsed.pipelineId) {
            ws.subscribedPipelines.delete(parsed.pipelineId);
          }
        } catch {
          this.sendToClient(ws, {
            type: 'ERROR',
            timestamp: new Date().toISOString(),
            data: { error: 'Invalid JSON message' },
          });
        }
      });

      ws.on('close', (code: number, reason: Buffer) => {
        console.log(`🔌 WebSocket client disconnected (code: ${code}, active: ${this.wss.clients.size})`);
      });

      ws.on('error', (err) => {
        console.error('WebSocket client error:', err);
      });
    });
  }

  /**
   * Heartbeat Ping/Pong 30 giây để chống ngắt kết nối trên Cloud Reverse Proxy (Railway)
   */
  private setupHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((client) => {
        const extWs = client as ExtendedWebSocket;
        if (extWs.isAlive === false) {
          console.log('⚠️ Terminating dead WebSocket client');
          return extWs.terminate();
        }

        extWs.isAlive = false;
        extWs.ping();
      });
    }, 30000);

    this.wss.on('close', () => {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
      }
    });
  }

  /**
   * Gửi tin nhắn tới 1 client
   */
  private sendToClient(ws: WebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast tin nhắn tới tất cả client đang kết nối (hoặc đã đăng ký pipelineId)
   */
  public broadcast<T>(message: WebSocketMessage<T>): void {
    this.wss.clients.forEach((client) => {
      const extWs = client as ExtendedWebSocket;
      if (extWs.readyState === WebSocket.OPEN) {
        // Nếu tin nhắn có gắn pipelineId, ưu tiên gửi cho client đã subscribe (hoặc nếu client chưa filter thì nhận hết)
        if (
          !message.pipelineId ||
          extWs.subscribedPipelines.size === 0 ||
          extWs.subscribedPipelines.has(message.pipelineId)
        ) {
          extWs.send(JSON.stringify(message));
        }
      }
    });
  }

  /**
   * Đếm số lượng client đang online
   */
  public getClientCount(): number {
    return this.wss.clients.size;
  }
}
