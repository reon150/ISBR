import { Test, TestingModule } from '@nestjs/testing';
import { IdempotencyService } from '@infrastructure/messaging/idempotency.service';
import {
  IProcessedEventRepository,
  PROCESSED_EVENT_REPOSITORY,
} from '@domain/repositories/processed-event.repository.interface';
import { ProcessingResult } from '@domain/shared/enums/processing-result.enum';
import { mockProcessedEventRepository } from '../../../mocks/domain/repositories.mock';

describe('IdempotencyService', () => {
  let service: IdempotencyService;
  let processedEventRepository: jest.Mocked<IProcessedEventRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdempotencyService,
        {
          provide: PROCESSED_EVENT_REPOSITORY,
          useValue: mockProcessedEventRepository,
        },
      ],
    }).compile();

    service = module.get<IdempotencyService>(IdempotencyService);
    processedEventRepository = module.get(PROCESSED_EVENT_REPOSITORY);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateEventId', () => {
    it('should generate consistent event ID for same data', () => {
      const eventType: string = 'test-event';
      const data: Record<string, string> = { test: 'data' };

      const id1: string = service.generateEventId(eventType, data);
      const id2: string = service.generateEventId(eventType, data);

      expect(id1).toBe(id2);
      expect(id1).toHaveLength(64); // SHA256 hex length
    });

    it('should generate different event IDs for different data', () => {
      const eventType: string = 'test-event';
      const data1: Record<string, string> = { test: 'data1' };
      const data2: Record<string, string> = { test: 'data2' };

      const id1: string = service.generateEventId(eventType, data1);
      const id2: string = service.generateEventId(eventType, data2);

      expect(id1).not.toBe(id2);
    });

    it('should generate different event IDs for different event types', () => {
      const eventType1: string = 'event-type-1';
      const eventType2: string = 'event-type-2';
      const data: Record<string, string> = { test: 'data' };

      const id1: string = service.generateEventId(eventType1, data);
      const id2: string = service.generateEventId(eventType2, data);

      expect(id1).not.toBe(id2);
    });
  });

  describe('processEvent', () => {
    it('should process new event successfully', async () => {
      const event: { eventType: string; data: Record<string, string> } = {
        eventType: 'test-event',
        data: { test: 'data' },
      };
      const handler: jest.MockedFunction<() => Promise<string>> = jest
        .fn()
        .mockResolvedValue('result');

      processedEventRepository.isEventProcessed.mockResolvedValue(false);
      processedEventRepository.markAsProcessed.mockResolvedValue(undefined);

      const result: { processed: boolean; result?: string; error?: string } =
        await service.processEvent(event, handler);

      expect(result.processed).toBe(true);
      expect(result.result).toBe('result');
      expect(result.error).toBeUndefined();
      expect(handler).toHaveBeenCalledWith({ test: 'data' });
      expect(processedEventRepository.markAsProcessed).toHaveBeenCalledWith(
        expect.any(String),
        'test-event',
        { test: 'data' },
        ProcessingResult.SUCCESS,
      );
    });

    it('should skip already processed event', async () => {
      const event: { eventType: string; data: Record<string, string> } = {
        eventType: 'test-event',
        data: { test: 'data' },
      };
      const handler: jest.MockedFunction<() => Promise<string>> = jest
        .fn()
        .mockResolvedValue('result');

      processedEventRepository.isEventProcessed.mockResolvedValue(true);

      const result: { processed: boolean; result?: string; error?: string } =
        await service.processEvent(event, handler);

      expect(result.processed).toBe(false);
      expect(result.result).toBeUndefined();
      expect(result.error).toBeUndefined();
      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle handler errors', async () => {
      const event: { eventType: string; data: Record<string, string> } = {
        eventType: 'test-event',
        data: { test: 'data' },
      };
      const handler: jest.MockedFunction<() => Promise<string>> = jest
        .fn()
        .mockRejectedValue(new Error('Handler error'));

      processedEventRepository.isEventProcessed.mockResolvedValue(false);
      processedEventRepository.markAsProcessed.mockResolvedValue(undefined);

      const result: { processed: boolean; result?: string; error?: string } =
        await service.processEvent(event, handler);

      expect(result.processed).toBe(false);
      expect(result.result).toBeUndefined();
      expect(result.error).toBe('Handler error');
      expect(processedEventRepository.markAsProcessed).toHaveBeenCalledWith(
        expect.any(String),
        'test-event',
        { test: 'data' },
        ProcessingResult.FAILED,
        'Handler error',
      );
    });

    it('should use provided event ID when available', async () => {
      const event: { eventId: string; eventType: string; data: Record<string, string> } = {
        eventId: 'custom-event-id',
        eventType: 'test-event',
        data: { test: 'data' },
      };
      const handler: jest.MockedFunction<() => Promise<string>> = jest
        .fn()
        .mockResolvedValue('result');

      processedEventRepository.isEventProcessed.mockResolvedValue(false);
      processedEventRepository.markAsProcessed.mockResolvedValue(undefined);

      const result: { processed: boolean; result?: string; error?: string } =
        await service.processEvent(event, handler);

      expect(result.processed).toBe(true);
      expect(processedEventRepository.isEventProcessed).toHaveBeenCalledWith('custom-event-id');
      expect(processedEventRepository.markAsProcessed).toHaveBeenCalledWith(
        'custom-event-id',
        'test-event',
        { test: 'data' },
        ProcessingResult.SUCCESS,
      );
    });
  });

  describe('cleanupOldEvents', () => {
    it('should cleanup old events', async () => {
      const daysToKeep: number = 7;
      processedEventRepository.deleteOlderThan.mockResolvedValue(5);

      const result: number = await service.cleanupOldEvents(daysToKeep);

      expect(result).toBe(5);
      expect(processedEventRepository.deleteOlderThan).toHaveBeenCalledWith(daysToKeep);
    });
  });
});
