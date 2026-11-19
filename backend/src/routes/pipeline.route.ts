import { Router, Request, Response } from 'express';
import { PipelineGraphSchema } from '../schemas/pipeline.schema.js';
import { deployerService } from '../services/deployer.service.js';

export const pipelineRouter = Router();

pipelineRouter.post('/compile-and-deploy', async (req: Request, res: Response) => {
  // 1. Thẩm định cú pháp Graph JSON
  const validation = PipelineGraphSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid Pipeline Graph Schema',
      details: validation.error.format(),
    });
  }

  try {
    // 2. Trích xuất tham số và deploy lên Reactive Lasna
    const result = await deployerService.deployPipeline(validation.data);
    return res.status(200).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    const isClientError = message.startsWith('DAG Validation Failed:');
    const signerUnavailable = message === 'Deployment signer is not configured.';
    console.error('Pipeline deploy failed:', error instanceof Error ? error.name : 'Unknown error');
    return res.status(isClientError ? 400 : signerUnavailable ? 503 : 500).json({
      success: false,
      error: isClientError ? 'DAG Validation Error' : 'Failed to deploy reactive pipeline',
      message: isClientError || signerUnavailable ? message : 'Unable to confirm the deployment on Lasna.',
    });
  }
});
