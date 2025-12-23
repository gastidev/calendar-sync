import cron from 'node-cron';
import { syncsRepository } from '../repositories/syncs.repository';
import { syncEngineService } from '../services/sync-engine.service';

export class CronService {
  private syncJob?: cron.ScheduledTask;

  startSyncCron(logger: any) {
    this.syncJob = cron.schedule('*/10 * * * *', async () => {
      logger.info('Running scheduled sync job');

      try {
        const activeSyncs = await syncsRepository.findActiveSyncs();

        logger.info(`Found ${activeSyncs.length} active syncs`);

        for (const sync of activeSyncs) {
          try {
            const result = await syncEngineService.executeSyncJob(sync.id);
            logger.info(`Sync ${sync.id} completed`, result);
          } catch (error: any) {
            logger.error(`Sync ${sync.id} failed:`, error.message);
          }
        }
      } catch (error: any) {
        logger.error('Cron job error:', error.message);
      }
    });

    logger.info('Sync cron job started (every 10 minutes)');
  }

  stop() {
    if (this.syncJob) {
      this.syncJob.stop();
    }
  }
}

export const cronService = new CronService();
