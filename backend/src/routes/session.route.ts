import { Router } from 'express';
import { z } from 'zod';
import type { Address, Hex } from 'viem';
import { env } from '../config/env.js';
import { bearerToken, workspaceSessions } from '../services/workspaceSession.service.js';

const challengeSchema = z.object({ address: z.string().regex(/^0x[0-9a-f]{40}$/i) });
const verifySchema = z.object({
  nonce: z.string().regex(/^[a-f0-9]{32}$/),
  signature: z.string().regex(/^0x[0-9a-f]{128}([0-9a-f]{2})?$/i),
});

export const sessionRouter = Router();

sessionRouter.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  if (req.get('Origin') !== env.WORKSPACE_ORIGIN) {
    return res.status(403).json({ error: 'Workspace origin is not allowed.' });
  }
  next();
});

sessionRouter.post('/challenge', (req, res) => {
  const input = challengeSchema.safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: 'A wallet address is required.' });
  const challenge = workspaceSessions.createChallenge(input.data.address as Address);
  if (!challenge) return res.status(429).json({ error: 'Too many sign-in requests. Try again shortly.' });
  return res.json(challenge);
});

sessionRouter.post('/verify', async (req, res, next) => {
  const input = verifySchema.safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: 'A nonce and wallet signature are required.' });
  try {
    const session = await workspaceSessions.verify(input.data.nonce, input.data.signature as Hex);
    if (!session) return res.status(401).json({ error: 'Sign-in failed. Request a new wallet challenge.' });
    return res.json(session);
  } catch (error) {
    return next(error);
  }
});

sessionRouter.delete('/', (req, res) => {
  workspaceSessions.revoke(bearerToken(req.get('Authorization')));
  return res.sendStatus(204);
});
