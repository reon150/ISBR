import { ProcessedEvent } from '../entities/processed-event.entity';

export interface EventMessage<T = Record<string, unknown>> {
  eventId?: string;
  eventType: string;
  data: T;
  timestamp?: number;
}

export interface IIdempotencyService {
  generateEventId<T extends Record<string, unknown>>(eventType: string, data: T): string;

  processEvent<T extends Record<string, unknown>, R = void>(
    event: EventMessage<T>,
    handler: (data: T) => Promise<R>,
  ): Promise<{ processed: boolean; result?: R; error?: string }>;

  isEventProcessed(eventId: string): Promise<boolean>;

  getEventHistory(eventType: string, limit?: number): Promise<ProcessedEvent[]>;

  cleanupOldEvents(daysToKeep?: number): Promise<number>;
}
