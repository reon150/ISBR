import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProcessedEvent } from '../../../domain/entities/processed-event.entity';
import { IProcessedEventRepository } from '../../../domain/repositories/processed-event.repository.interface';
import { ProcessingResult } from '../../../domain/shared/enums/processing-result.enum';

@Injectable()
export class ProcessedEventRepository implements IProcessedEventRepository {
  constructor(
    @InjectRepository(ProcessedEvent)
    private readonly repository: Repository<ProcessedEvent>,
  ) {}

  async isEventProcessed(eventId: string): Promise<boolean> {
    const count: number = await this.repository.count({ where: { eventId } });
    return count > 0;
  }

  async markAsProcessed(
    eventId: string,
    eventType: string,
    eventData: Record<string, unknown>,
    result: ProcessingResult,
    errorMessage?: string,
  ): Promise<ProcessedEvent> {
    const processedEvent: ProcessedEvent = this.repository.create({
      eventId,
      eventType,
      eventData,
      processingResult: result,
      errorMessage: errorMessage || null,
    } as unknown as ProcessedEvent);

    return this.repository.save(processedEvent);
  }

  async findByEventType(eventType: string, limit: number = 100): Promise<ProcessedEvent[]> {
    return this.repository.find({
      where: { eventType },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async deleteOlderThan(daysToKeep: number): Promise<number> {
    const cutoffDate: Date = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result: { affected?: number } = (await this.repository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute()) as { affected?: number };

    return result.affected || 0;
  }
}
