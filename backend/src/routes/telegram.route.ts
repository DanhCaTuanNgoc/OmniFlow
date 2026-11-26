import { Router } from 'express';
import { env } from '../config/env.js';
import { deploymentStore } from '../data/deployments.js';
import { bearerToken, workspaceSessions } from '../services/workspaceSession.service.js';

export const telegramRouter = Router();

telegramRouter.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  if (req.method !== 'GET' && req.get('Origin') !== env.WORKSPACE_ORIGIN) {
    return res.status(403).json({ error: 'Workspace origin is not allowed.' });
  }
  const session = workspaceSessions.getSession(bearerToken(req.get('Authorization')));
  if (!session) return res.status(401).json({ error: 'Sign in with your wallet to manage Telegram alerts.' });
  res.locals.owner = session.owner.toLowerCase();
  next();
});

telegramRouter.get('/status', (_req, res) => res.json({
  enabled: Boolean(env.TELEGRAM_BOT_TOKEN),
  linked: deploymentStore().telegram.status(res.locals.owner),
}));

telegramRouter.post('/link', (_req, res) => {
  if (!env.TELEGRAM_BOT_USERNAME) return res.status(503).json({ error: 'Telegram alerts are unavailable.' });
  const store = deploymentStore().telegram;
  if (store.status(res.locals.owner)) return res.status(409).json({ error: 'This wallet is already linked.' });
  const { code, expires } = store.createCode(res.locals.owner);
  return res.json({ url: `https://t.me/${env.TELEGRAM_BOT_USERNAME}?start=${code}`, expires });
});

telegramRouter.delete('/link', (_req, res) => {
  deploymentStore().telegram.disconnect(res.locals.owner);
  return res.json({ linked: false });
});
