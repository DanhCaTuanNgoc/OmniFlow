'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { APP_CONFIG } from '@/lib/constants';

export type WebSocketStatus = 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';

export interface WebSocketMessagePayload {
  type: string;
  pipelineId?: string;
  timestamp?: string;
  data?: any;
}

interface WebSocketContextType {
  status: WebSocketStatus;
  sendMessage: (msg: any) => void;
  addListener: (listener: (msg: WebSocketMessagePayload) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<WebSocketStatus>('CONNECTING');
  const wsRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Set<(msg: WebSocketMessagePayload) => void>>(new Set());
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const sendMessage = useCallback((msg: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  }, []);

  const addListener = useCallback((listener: (msg: WebSocketMessagePayload) => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    const connect = () => {
      if (!isMountedRef.current) return;

      // Tránh mở kết nối trùng lặp nếu đang mở hoặc đang kết nối
      if (
        wsRef.current &&
        (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      setStatus('CONNECTING');

      try {
        const ws = new WebSocket(APP_CONFIG.wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMountedRef.current) {
            ws.close(1000, 'Unmounted');
            return;
          }
          setStatus('CONNECTED');
          // Tự động subscribe pipeline all để nhận toàn bộ telemetry
          ws.send(JSON.stringify({ type: 'SUBSCRIBE_PIPELINE', pipelineId: 'all' }));
        };

        ws.onmessage = (event) => {
          if (!isMountedRef.current) return;
          try {
            const parsed = JSON.parse(event.data);
            listenersRef.current.forEach((listener) => {
              try {
                listener(parsed);
              } catch (err) {
                console.error('WebSocket listener error:', err);
              }
            });
          } catch {
            // Non-JSON payload
          }
        };

        ws.onclose = (event) => {
          if (!isMountedRef.current) return;
          setStatus('DISCONNECTED');
          wsRef.current = null;
          // Tự động tái kết nối sau 3 giây nếu bị ngắt ngoài ý muốn
          if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          if (!isMountedRef.current) return;
          setStatus('DISCONNECTED');
        };
      } catch {
        if (isMountedRef.current) {
          setStatus('DISCONNECTED');
          if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = setTimeout(connect, 3000);
        }
      }
    };

    connect();

    return () => {
      isMountedRef.current = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        const ws = wsRef.current;
        wsRef.current = null;
        ws.onopen = null;
        ws.onmessage = null;
        ws.onclose = null;
        ws.onerror = null;
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close(1000, 'Workspace Unmounted');
        }
      }
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ status, sendMessage, addListener }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
