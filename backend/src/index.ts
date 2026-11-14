import { createApp } from './app.js';
import { env } from './config/env.js';

const { server } = createApp();

server.listen(env.PORT, () => {
  console.log(`🚀 OmniFlow Backend running on port ${env.PORT} [${env.NODE_ENV}]`);
  console.log(`📡 Base Sepolia RPC: ${env.BASE_SEPOLIA_RPC_URL}`);
  console.log(`⚡ Reactive Lasna RPC: ${env.LASNA_RPC_URL}`);
});

// Graceful Shutdown
const shutdown = () => {
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
