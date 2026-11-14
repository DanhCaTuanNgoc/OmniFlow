import { Router, Request, Response } from 'express';
import { createPublicClient, http } from 'viem';
import { env } from '../config/env.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req: Request, res: Response) => {
  const timestamp = new Date().toISOString();

  let baseSepoliaOk = false;
  let baseSepoliaBlock = 0n;
  let lasnaOk = false;
  let lasnaBlock = 0n;

  // 1. Kiểm tra Base Sepolia RPC
  try {
    const baseClient = createPublicClient({
      transport: http(env.BASE_SEPOLIA_RPC_URL),
    });
    baseSepoliaBlock = await baseClient.getBlockNumber();
    baseSepoliaOk = true;
  } catch (error) {
    console.error('Base Sepolia health check failed:', error);
  }

  // 2. Kiểm tra Reactive Lasna RPC
  try {
    const lasnaClient = createPublicClient({
      transport: http(env.LASNA_RPC_URL),
    });
    lasnaBlock = await lasnaClient.getBlockNumber();
    lasnaOk = true;
  } catch (error) {
    console.error('Reactive Lasna health check failed:', error);
  }

  const allHealthy = baseSepoliaOk && lasnaOk;
  const statusCode = allHealthy ? 200 : 503;

  return res.status(statusCode).json({
    status: allHealthy ? 'healthy' : 'degraded',
    service: 'omniflow-backend',
    timestamp,
    chains: {
      baseSepolia: {
        chainId: 84532,
        rpcUrl: env.BASE_SEPOLIA_RPC_URL,
        status: baseSepoliaOk ? 'connected' : 'unreachable',
        blockNumber: baseSepoliaBlock.toString(),
      },
      reactiveLasna: {
        chainId: 5318007,
        rpcUrl: env.LASNA_RPC_URL,
        status: lasnaOk ? 'connected' : 'unreachable',
        blockNumber: lasnaBlock.toString(),
      },
    },
    relayerConfigured: Boolean(env.RELAYER_PRIVATE_KEY),
  });
});
