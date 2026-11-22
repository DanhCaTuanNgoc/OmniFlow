import { Router, Request, Response } from 'express';
import { PipelineDraftSchema, PipelineGraphSchema } from '../schemas/pipeline.schema.js';
import { deployerService, takeProfitTemplate } from '../services/deployer.service.js';
import { ACTION_VAULT_ABI, PRICE_ORDER_VAULT_ABI } from '@omniflow/shared';
import { chainService } from '../services/chain.service.js';
import { bearerToken, workspaceSessions } from '../services/workspaceSession.service.js';
import { DeploymentConflict, DeploymentLimit, deploymentStore, graphSnapshot } from '../data/deployments.js';
import { vaultRouter } from './vault.route.js';
import { z } from 'zod';
import { formatEther, type Hash } from 'viem';
import { env } from '../config/env.js';
import { deploymentSteps, recordDeploymentStep } from '../services/deploymentSteps.js';
import { readDeploymentRuntime } from '../services/deploymentRuntime.js';
import { getDraft, listDrafts, saveDraft, deleteDraft } from '../data/pipelineDrafts.js';

export const pipelineRouter = Router();

pipelineRouter.get('/deployment-config', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  return res.json({ fundingLReact: formatEther(env.RSC_DEPLOY_FUNDING_LREACT) });
});

pipelineRouter.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  const session = workspaceSessions.getSession(bearerToken(req.get('Authorization')));
  if (!session) return res.status(401).json({ error: 'Sign in with your wallet to deploy.' });
  res.locals.workspaceOwner = session.owner;
  next();
});

pipelineRouter.use('/vaults', vaultRouter);

pipelineRouter.get('/drafts', async (_req, res, next) => {
  try {
    return res.json({ drafts: await listDrafts(res.locals.workspaceOwner) });
  } catch (error) {
    next(error);
  }
});

pipelineRouter.get('/drafts/:id', async (req, res, next) => {
  if (!z.string().uuid().safeParse(req.params.id).success) {
    return res.status(404).json({ error: 'Pipeline draft not found.' });
  }
  try {
    const draft = await getDraft(res.locals.workspaceOwner, req.params.id);
    if (!draft) return res.status(404).json({ error: 'Pipeline draft not found.' });
    return res.json({ id: draft.id, updatedAt: draft.updatedAt, graph: JSON.parse(draft.graphJson) });
  } catch (error) {
    next(error);
  }
});

const draftSaveSchema = z.object({
  graph: PipelineDraftSchema,
  revision: z.object({ id: z.string().uuid(), updatedAt: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER - 1) }).optional(),
});

pipelineRouter.post('/drafts', async (req, res, next) => {
  const validation = draftSaveSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ error: 'Invalid pipeline draft.' });
  const { graph, revision } = validation.data;
  const owner = res.locals.workspaceOwner;
  if (graph.metadata.ownerAddress.toLowerCase() !== owner.toLowerCase()) {
    return res.status(403).json({ error: 'The draft owner must match the signed-in wallet.' });
  }
  try {
    const draft = await saveDraft(owner, graphSnapshot(graph), graph.metadata.name, revision);
    if (!draft) return res.status(409).json({ error: 'The saved draft changed. Reopen it before replacing it.' });
    return res.json({ id: draft.id, updatedAt: draft.updatedAt });
  } catch (error) {
    next(error);
  }
});

const draftDeleteSchema = z.object({
  revision: z.object({ updatedAt: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER - 1) }).optional(),
}).optional();

pipelineRouter.delete('/drafts/:id', async (req, res, next) => {
  if (!z.string().uuid().safeParse(req.params.id).success) {
    return res.status(404).json({ error: 'Pipeline draft not found.' });
  }
  const validation = draftDeleteSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ error: 'Invalid delete request.' });
  const owner = res.locals.workspaceOwner;
  try {
    const existing = await getDraft(owner, req.params.id);
    if (!existing) return res.status(404).json({ error: 'Pipeline draft not found.' });
    const revision = validation.data?.revision ? { id: req.params.id, updatedAt: validation.data.revision.updatedAt } : undefined;
    const deleted = await deleteDraft(owner, req.params.id, revision);
    if (!deleted) return res.status(409).json({ error: 'The draft changed since you opened it. Reopen before deleting.' });
    return res.json({ success: true, id: req.params.id });
  } catch (error) {
    next(error);
  }
});

pipelineRouter.get('/deployments', async (_req, res, next) => {
  try {
    return res.json({ deployments: await deployerService.listDeployments(res.locals.workspaceOwner) });
  } catch (error) {
    return next(error);
  }
});

pipelineRouter.get('/deployments/:id', async (req, res, next) => {
  try {
    await deployerService.refreshOwnerDeployment(res.locals.workspaceOwner, req.params.id);
    const deployment = deployerService.getDeployment(res.locals.workspaceOwner, req.params.id);
    if (!deployment) return res.status(404).json({ error: 'Deployment not found.' });
    const runtime = await readDeploymentRuntime(deployment, res.locals.workspaceOwner);
    return res.json({
      ...deployment,
      runtime,
      latestExecution: deploymentStore().history(res.locals.workspaceOwner, req.params.id)[0] ?? null,
    });
  } catch (error) {
    return next(error);
  }
});

pipelineRouter.put('/deployments/:id/archive', async (req, res, next) => {
  const input = z.object({ archived: z.boolean() }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: 'A valid archive state is required.' });
  const owner = res.locals.workspaceOwner;
  try {
    const deployment = deployerService.getDeployment(owner, req.params.id);
    if (!deployment) return res.status(404).json({ error: 'Deployment not found.' });
    const { rscAddress, vaultAddress } = deployment.contracts;
    if (deployment.status !== 'deployed' || !rscAddress) {
      return res.status(409).json({ error: 'Wait for the deployment receipt before archiving.' });
    }
    if (input.data.archived) {
      let authorized;
      try {
        if (await chainService.basePublicClient.getChainId() !== 84532) throw new Error('Unexpected Base chain.');
        authorized = await chainService.basePublicClient.readContract({
          address: vaultAddress,
          abi: deployment.template === takeProfitTemplate ? PRICE_ORDER_VAULT_ABI : ACTION_VAULT_ABI,
          functionName: 'authorizedRSCs',
          args: [rscAddress],
        });
      } catch {
        return res.status(502).json({ error: 'Unable to verify Vault permission on Base Sepolia.' });
      }
      if (authorized !== false) return res.status(409).json({ error: 'Pause the automation before archiving it.' });
    }
    if (!deploymentStore().setArchived(owner, req.params.id, input.data.archived)) {
      return res.status(409).json({ error: 'The deployment is no longer available for this action.' });
    }
    return res.json({ archived: input.data.archived });
  } catch (error) {
    return next(error);
  }
});

const stepSchema = z.object({
  kind: z.enum(deploymentSteps),
  hash: z.custom<Hash>(value => typeof value === 'string' && /^0x[0-9a-f]{64}$/i.test(value)),
});

pipelineRouter.post('/deployments/:id/steps', async (req, res) => {
  const input = stepSchema.safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: 'A valid deployment step and transaction hash are required.' });
  try {
    const result = await recordDeploymentStep(res.locals.workspaceOwner, req.params.id, input.data.kind, input.data.hash);
    if (result === undefined) return res.status(404).json({ error: 'Deployment not found.' });
    if (!result) return res.status(409).json({ error: 'The receipt does not match this deployment step.' });
    return res.json({ recorded: true });
  } catch {
    return res.status(502).json({ error: 'Unable to verify the step receipt on its chain.' });
  }
});

pipelineRouter.post('/compile-and-deploy', async (req: Request, res: Response) => {
  const key = req.get('Idempotency-Key');
  if (!key || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(key)) {
    return res.status(400).json({ error: 'An Idempotency-Key UUID is required.' });
  }
  const owner = res.locals.workspaceOwner;
  const workspacePipelineId = req.get('Workspace-Pipeline-Id');
  if (workspacePipelineId && !z.string().uuid().safeParse(workspacePipelineId).success) {
    return res.status(400).json({ error: 'Invalid workspace pipeline ID.' });
  }

  const validation = PipelineGraphSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid Pipeline Graph Schema',
      details: validation.error.format(),
    });
  }
  if (validation.data.metadata.ownerAddress.toLowerCase() !== owner.toLowerCase()) {
    return res.status(403).json({ error: 'The pipeline owner must match the signed-in wallet.' });
  }

  try {
    const graph = { ...validation.data, metadata: { ...validation.data.metadata, ownerAddress: owner } };
    const result = await deployerService.deployPipeline(graph, key, workspacePipelineId);
    return res.status(result.status === 'signed' ? 202 : 200).json(result);
  } catch (error: unknown) {
    if (error instanceof DeploymentConflict) return res.status(409).json({ error: error.message });
    if (error instanceof DeploymentLimit) return res.status(429).json({ error: error.message });
    const message = error instanceof Error ? error.message : '';
    const isClientError = message.startsWith('DAG Validation Failed:');
    const signerUnavailable = ['Deployment signer is not configured.', 'Deployment signer has insufficient lREACT.'].includes(message);
    console.error('Pipeline deploy failed:', error instanceof Error ? error.name : 'Unknown error');
    return res.status(isClientError ? 400 : signerUnavailable ? 503 : 500).json({
      success: false,
      error: isClientError ? 'DAG Validation Error' : 'Failed to deploy reactive pipeline',
      message: isClientError || signerUnavailable ? message : 'Unable to confirm the deployment on Lasna.',
    });
  }
});


const ownerTakeProfitRequest = z.object({
  graph: PipelineGraphSchema,
  draftId: z.string().uuid(),
  key: z.string().uuid(),
  hash: z.string().regex(/^0x[0-9a-fA-F]{64}$/).transform(value => value.toLowerCase() as Hash).optional(),
});

pipelineRouter.post('/take-profit/deploy', async (req, res) => {
  const input = ownerTakeProfitRequest.safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: 'Invalid Take-Profit deployment request.' });
  const owner = res.locals.workspaceOwner;
  const { graph, draftId, key, hash } = input.data;
  if (graph.metadata.ownerAddress.toLowerCase() !== owner.toLowerCase()) {
    return res.status(403).json({ error: 'The graph owner must match the signed-in wallet.' });
  }
  try {
    return res.json(await deployerService.ownerTakeProfit(graph, draftId, key, hash));
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (error instanceof DeploymentConflict || error instanceof DeploymentLimit) {
      return res.status(error instanceof DeploymentLimit ? 429 : 409).json({ error: message });
    }
    if (message.startsWith('DAG Validation Failed:') || message.includes('insufficient lREACT')) {
      return res.status(400).json({ error: message.replace(/^DAG Validation Failed: /, '') });
    }
    return res.status(502).json({ error: 'Unable to verify the Take-Profit deployment. Retry the same attempt.' });
  }
});
