import app from './app.js';
import { validateEnv, config } from './utils/config.js';
import { logger } from './utils/logger.js';

validateEnv();

const PORT = config.port;

const server = app.listen(PORT, async () => {
  logger.info(`BharatMandi Backend listening on port ${PORT}`, {
    port: PORT,
    env: config.nodeEnv
  });

  // Check ONDC Mock Server connectivity on startup to "wake it up"
  const { ondcClient } = await import('./integrations/ondcClient.js');
  await ondcClient.checkHealth();
});

// Graceful Shutdown
const shutdown = () => {
  logger.info('Shutting down server gracefully...');
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });

  // Force shutdown after 10s
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
