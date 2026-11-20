import { Router, Request, Response } from 'express';
import { eventListenerService } from '../services/eventListener.service.js';
import { bearerToken, workspaceSessions } from '../services/workspaceSession.service.js';
import { deploymentStore } from '../data/deployments.js';

export const logsRouter = Router();

logsRouter.get('/', (req: Request, res: Response) => {
  res.set('Cache-Control', 'no-store');
  const session = workspaceSessions.getSession(bearerToken(req.get('Authorization')));
  if (!session) return res.status(401).json({ error: 'Sign in with your wallet to read activity.' });
  const pipelineId = req.query.pipelineId;
  if (pipelineId !== undefined && typeof pipelineId !== 'string') {
    return res.status(400).json({ error: 'Invalid pipeline ID.' });
  }
  const owns = (id: string) => deploymentStore().owns(session.owner, id);
  if (pipelineId && !owns(pipelineId)) return res.status(404).json({ error: 'Deployment not found.' });
  const { before, sequence } = req.query;
  if ((before !== undefined || sequence !== undefined) &&
      (typeof before !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(before) ||
        typeof sequence !== 'string' || !/^\d+$/.test(sequence) || !Number.isSafeInteger(Number(sequence)))) {
    return res.status(400).json({ error: 'Invalid activity cursor.' });
  }
  const { logs, next } = deploymentStore().historyPage(session.owner, pipelineId || undefined,
    typeof before === 'string' ? { timestamp: before, sequence: Number(sequence) } : undefined);

  return res.json({
    success: true,
    count: logs.length,
    pipelineFilter: pipelineId || 'ALL',
    indexer: pipelineId ? eventListenerService.state(pipelineId) ?? null : null,
    logs,
    next,
  });
});
