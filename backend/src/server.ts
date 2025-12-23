import { buildApp } from './app';
import { env } from './config/env';
import { cronService } from './services/cron.service';

async function start() {
  try {
    const app = await buildApp();

    const port = parseInt(env.PORT);
    await app.listen({ port, host: '0.0.0.0' });

    cronService.startSyncCron(app.log);

    app.log.info(`Server listening on port ${port}`);

    const shutdown = async () => {
      app.log.info('Shutting down...');
      cronService.stop();
      await app.close();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

start();
