import { Injectable, Logger, Inject } from '@nestjs/common';
import {
  IProcessedEventRepository,
  PROCESSED_EVENT_REPOSITORY,
} from '../../domain/repositories/processed-event.repository.interface';
import { ProcessingResult } from '../../domain/shared/enums/processing-result.enum';
import {
  IIdempotencyService,
  EventMessage,
} from '../../domain/services/idempotency.service.interface';
import * as crypto from 'crypto';

@Injectable()
export class IdempotencyService implements IIdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);

  constructor(
    @Inject(PROCESSED_EVENT_REPOSITORY)
    private readonly processedEventRepository: IProcessedEventRepository,
  ) {}

  generateEventId<T extends Record<string, unknown>>(eventType: string, data: T): string {
    const content: string = JSON.stringify({ eventType, data });
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  async processEvent<T extends Record<string, unknown>, R = void>(
    event: EventMessage<T>,
    handler: (data: T) => Promise<R>,
  ): Promise<{ processed: boolean; result?: R; error?: string }> {
    const eventId: string = event.eventId || this.generateEventId(event.eventType, event.data);

    const isProcessed: boolean = await this.processedEventRepository.isEventProcessed(eventId);

    if (isProcessed) {
      this.logger.log(`Event ${eventId} (type: ${event.eventType}) already processed. Skipping.`);

      await this.processedEventRepository.markAsProcessed(
        eventId,
        event.eventType,
        event.data,
        ProcessingResult.SKIPPED,
        'Event was already processed',
      );

      return { processed: false };
    }

    try {
      this.logger.log(`Processing event ${eventId} (type: ${event.eventType})`);

      const result: R = await handler(event.data);

      await this.processedEventRepository.markAsProcessed(
        eventId,
        event.eventType,
        event.data,
        ProcessingResult.SUCCESS,
      );

      this.logger.log(`Event ${eventId} processed successfully`);

      return { processed: true, result };
    } catch (error) {
      const errorMessage: string = error instanceof Error ? error.message : 'Unknown error';
      const errorStack: string | undefined = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error processing event ${eventId}: ${errorMessage}`, errorStack);

      await this.processedEventRepository.markAsProcessed(
        eventId,
        event.eventType,
        event.data,
        ProcessingResult.FAILED,
        errorMessage,
      );

      return { processed: false, error: errorMessage };
    }
  }

  async isEventProcessed(eventId: string): Promise<boolean> {
    return await this.processedEventRepository.isEventProcessed(eventId);
  }

  async getEventHistory(eventType: string, limit: number = 100) {
    return await this.processedEventRepository.findByEventType(eventType, limit);
  }

  async cleanupOldEvents(daysToKeep: number = 30): Promise<number> {
    this.logger.log(`Cleaning up processed events older than ${daysToKeep} days`);
    const deleted: number = await this.processedEventRepository.deleteOlderThan(daysToKeep);
    this.logger.log(`Deleted ${deleted} old processed events`);
    return deleted;
  }
}
