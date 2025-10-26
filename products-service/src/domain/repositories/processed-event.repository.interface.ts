import { ProcessedEvent } from '../entities/processed-event.entity';
import { ProcessingResult } from '../shared/enums/processing-result.enum';

export interface IProcessedEventRepository {
  isEventProcessed(eventId: string): Promise<boolean>;

  markAsProcessed(
    eventId: string,
    eventType: string,
    eventData: Record<string, unknown>,
    result: ProcessingResult,
    errorMessage?: string,
  ): Promise<ProcessedEvent>;

  findByEventType(eventType: string, limit?: number): Promise<ProcessedEvent[]>;

  deleteOlderThan(daysToKeep: number): Promise<number>;
}

export const PROCESSED_EVENT_REPOSITORY: string = 'PROCESSED_EVENT_REPOSITORY';
