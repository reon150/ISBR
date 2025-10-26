import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ProcessedEvent } from '../../../domain/entities/processed-event.entity';
import { ProcessingResult } from '../../../domain/shared/enums/processing-result.enum';
import { IProcessedEventRepository } from '../../../domain/repositories/processed-event.repository.interface';

@Injectable()
export class ProcessedEventRepository implements IProcessedEventRepository {
  constructor(
    @InjectRepository(ProcessedEvent)
    private readonly repository: Repository<ProcessedEvent>,
  ) {}

  async isEventProcessed(eventId: string): Promise<boolean> {
    const count: number = await this.repository.count({
      where: { eventId },
    });
    return count > 0;
  }

  async markAsProcessed<T extends Record<string, unknown>>(
    eventId: string,
    eventType: string,
    eventData: T,
    result: ProcessingResult,
    errorMessage?: string,
  ): Promise<ProcessedEvent> {
    const processedEvent: ProcessedEvent = this.repository.create({
      eventId,
      eventType,
      eventData,
      processingResult: result,
      errorMessage,
    });

    return await this.repository.save(processedEvent);
  }

  async findByEventId(eventId: string): Promise<ProcessedEvent | null> {
    return await this.repository.findOne({
      where: { eventId },
    });
  }

  async findByEventType(eventType: string, limit: number = 100): Promise<ProcessedEvent[]> {
    return await this.repository.find({
      where: { eventType },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async deleteOlderThan(days: number): Promise<number> {
    const date: Date = new Date();
    date.setDate(date.getDate() - days);

    const result: { affected?: number | null } = await this.repository.delete({
      createdAt: LessThan(date),
    });

    return result.affected || 0;
  }
}
