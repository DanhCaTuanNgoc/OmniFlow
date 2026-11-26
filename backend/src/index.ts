import { createApp } from './app.js';
import { env } from './config/env.js';
import { eventListenerService } from './services/eventListener.service.js';
import { deployerService } from './services/deployer.service.js';
import { startTelegram } from './services/telegram.service.js';

const { server } = createApp();
const telegram = new AbortController();
startTelegram(telegram.signal);

server.listen(env.PORT, () => {
  console.log(`🚀 OmniFlow Backend running on port ${env.PORT} [${env.NODE_ENV}]`);
});

const syncWorkspace = () => {
  void eventListenerService.sync().catch(() => console.error('Unable to synchronize execution history.'));
  void deployerService.resumePending().catch(() => console.error('Unable to reconcile the pending Lasna deployment.'));
};
const workspaceTimer = setInterval(syncWorkspace, 15_000);
workspaceTimer.unref();
syncWorkspace();

// Graceful Shutdown
const shutdown = () => {
  telegram.abort();
  clearInterval(workspaceTimer);
  console.log('🛑 Graceful shutdown initiated...');
  server.close(() => {
    console.log('💤 HTTP & WebSocket server closed.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('⚠️ Forcing shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
