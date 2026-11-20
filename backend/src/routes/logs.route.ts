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
  const logs = deploymentStore().history(session.owner, pipelineId || undefined);

  return res.json({
    success: true,
    count: logs.length,
    pipelineFilter: pipelineId || 'ALL',
    indexer: pipelineId ? eventListenerService.state(pipelineId) ?? null : null,
    logs,
  });
});
