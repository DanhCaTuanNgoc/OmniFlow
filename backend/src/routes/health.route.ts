import { Router, Request, Response } from 'express';
import { chainService } from '../services/chain.service.js';
import { env } from '../config/env.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req: Request, res: Response) => {
  const timestamp = new Date().toISOString();

  // Kiểm tra sức khỏe kết nối qua ChainService tập trung
  const health = await chainService.checkHealth();
  const relayerInfo = await chainService.getRelayerLasnaBalance();

  const allHealthy = health.baseSepolia.ok && health.reactiveLasna.ok;
  const statusCode = allHealthy ? 200 : 503;

  return res.status(statusCode).json({
    status: allHealthy ? 'healthy' : 'degraded',
    service: 'omniflow-backend',
    timestamp,
    chains: {
      baseSepolia: {
        chainId: health.baseSepolia.chainId,
        rpcUrl: env.BASE_SEPOLIA_RPC_URL,
        status: health.baseSepolia.ok ? 'connected' : 'unreachable',
        blockNumber: health.baseSepolia.blockNumber.toString(),
      },
      reactiveLasna: {
        chainId: health.reactiveLasna.chainId,
        rpcUrl: env.LASNA_RPC_URL,
        status: health.reactiveLasna.ok ? 'connected' : 'unreachable',
        blockNumber: health.reactiveLasna.blockNumber.toString(),
      },
    },
    relayer: relayerInfo
      ? {
          configured: true,
          address: relayerInfo.address,
          balanceLReact: relayerInfo.balanceFormatted,
        }
      : {
          configured: false,
        },
  });
});
