import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { IIdempotencyService } from '../../domain/services/idempotency.service.interface';
import { IDEMPOTENCY_SERVICE } from '../messaging/product-event-consumer.service';
import { ConfigService } from '@nestjs/config';
import { getConfig, AppConfiguration } from '../config';

@Injectable()
export class EventCleanupScheduler {
  private readonly logger = new Logger(EventCleanupScheduler.name);
  private readonly daysToKeep: number;

  constructor(
    @Inject(IDEMPOTENCY_SERVICE)
    private readonly idempotencyService: IIdempotencyService,
    private readonly configService: ConfigService,
  ) {
    const config: AppConfiguration = getConfig(this.configService);
    this.daysToKeep = config.scheduler.eventRetentionDays;
    this.logger.log(
      `Event cleanup scheduler initialized. Retention period: ${this.daysToKeep} days, Cron: ${process.env.EVENT_CLEANUP_CRON || '0 2 * * *'}`,
    );
  }

  @Cron(process.env.EVENT_CLEANUP_CRON || '0 2 * * *', {
    name: 'cleanup-old-events',
    timeZone: 'America/Santo_Domingo',
  })
  async handleEventCleanup() {
    this.logger.log('Starting scheduled cleanup of old processed events...');

    try {
      const deleted: number = await this.idempotencyService.cleanupOldEvents(this.daysToKeep);

      if (deleted > 0) {
        this.logger.log(
          `Successfully cleaned up ${deleted} processed events older than ${this.daysToKeep} days`,
        );
      } else {
        this.logger.log(`No events older than ${this.daysToKeep} days found to clean up`);
      }
    } catch (error) {
      const errorMessage: string = error instanceof Error ? error.message : 'Unknown error';
      const errorStack: string | undefined = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to clean up old events: ${errorMessage}`, errorStack);
    }
  }
}
