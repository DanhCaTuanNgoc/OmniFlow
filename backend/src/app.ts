import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import { env } from './config/env.js';
import { healthRouter } from './routes/health.route.js';
import { WebSocketGateway } from './websocket/gateway.js';

export function createApp(): {
  app: Express;
  server: http.Server;
  wsGateway: WebSocketGateway;
} {
  const app = express();
  const server = http.createServer(app);

  // Security Headers & Middlewares
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ALLOWED_ORIGINS === '*' ? '*' : env.CORS_ALLOWED_ORIGINS.split(','),
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Khởi tạo WebSocket Gateway trên cùng http server
  const wsGateway = new WebSocketGateway(server);

  // Routes
  app.use('/health', healthRouter);

  // Root endpoint
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'OmniFlow Backend API',
      version: '1.0.0',
      description: 'The Zapier of Web3: No-Code Cross-Chain Automation Powered by Reactive Omni',
      health: '/health',
      websocket: '/stream',
      activeWsClients: wsGateway.getClientCount(),
    });
  });

  // 404 Handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });

  // Global Error Handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  });

  return { app, server, wsGateway };
}
