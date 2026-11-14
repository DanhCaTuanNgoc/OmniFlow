import { Router, Request, Response } from 'express';
import { eventListenerService } from '../services/eventListener.service.js';

export const logsRouter = Router();

logsRouter.get('/', (req: Request, res: Response) => {
  const pipelineId = req.query.pipelineId as string | undefined;
  const logs = eventListenerService.getLogs(pipelineId);

  return res.json({
    success: true,
    count: logs.length,
    pipelineFilter: pipelineId || 'ALL',
    logs,
  });
});
