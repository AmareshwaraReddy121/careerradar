import { env } from './config/env';
import { connectDb, disconnectDb } from './lib/db';
import { logger } from './lib/logger';
import { createApp } from './app';

async function main() {
  await connectDb(env.MONGODB_URI);
  const server = createApp().listen(env.API_PORT, () => {
    logger.info(`API listening on http://localhost:${env.API_PORT}`);
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Shutting down');
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start API');
  process.exit(1);
});
