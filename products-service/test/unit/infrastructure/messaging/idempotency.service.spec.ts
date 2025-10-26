import { Test, TestingModule } from '@nestjs/testing';
import {
  IdempotencyService,
  IDEMPOTENCY_SERVICE,
} from '@infrastructure/messaging/idempotency.service';
import {
  IProcessedEventRepository,
  PROCESSED_EVENT_REPOSITORY,
} from '@domain/repositories/processed-event.repository.interface';
import { ProcessingResult } from '@domain/shared/enums/processing-result.enum';
import { IIdempotencyService, EventMessage } from '@domain/services/idempotency.service.interface';

describe('IdempotencyService', () => {
  let service: IdempotencyService;
  let processedEventRepository: jest.Mocked<IProcessedEventRepository>;

  const mockProcessedEventRepository: jest.Mocked<IProcessedEventRepository> = {
    isEventProcessed: jest.fn(),
    markAsProcessed: jest.fn(),
    findByEventType: jest.fn(),
    deleteOlderThan: jest.fn(),
  };

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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateEventId', () => {
    it('should generate a unique event ID', () => {
      const eventType: string = 'TEST_EVENT';
      const data: Record<string, unknown> = { test: 'data' };

      const id1: string = service.generateEventId(eventType, data);
      const id2: string = service.generateEventId(eventType, data);

      expect(id1).toBe(id2);
      expect(id1).toHaveLength(64);
    });

    it('should generate different IDs for different data', () => {
      const eventType: string = 'TEST_EVENT';
      const data1: Record<string, unknown> = { test: 'data1' };
      const data2: Record<string, unknown> = { test: 'data2' };

      const id1: string = service.generateEventId(eventType, data1);
      const id2: string = service.generateEventId(eventType, data2);

      expect(id1).not.toBe(id2);
    });
  });

  describe('processEvent', () => {
    it('should skip already processed events', async () => {
      const event: EventMessage<Record<string, unknown>> = {
        eventId: 'test-event-id',
        eventType: 'TEST_EVENT',
        data: { test: 'data' },
      };

      mockProcessedEventRepository.isEventProcessed.mockResolvedValue(true);

      const result = await service.processEvent(event, async () => {});

      expect(processedEventRepository.isEventProcessed).toHaveBeenCalledWith('test-event-id');
      expect(result.processed).toBe(false);
      expect(processedEventRepository.markAsProcessed).toHaveBeenCalledWith(
        'test-event-id',
        'TEST_EVENT',
        { test: 'data' },
        ProcessingResult.SKIPPED,
        'Event was already processed',
      );
    });

    it('should process new events successfully', async () => {
      const event: EventMessage<Record<string, unknown>> = {
        eventId: 'test-event-id',
        eventType: 'TEST_EVENT',
        data: { test: 'data' },
      };

      const handler = jest.fn().mockResolvedValue({ success: true });

      mockProcessedEventRepository.isEventProcessed.mockResolvedValue(false);
      mockProcessedEventRepository.markAsProcessed.mockResolvedValue(undefined);

      const result = await service.processEvent(event, handler);

      expect(handler).toHaveBeenCalledWith({ test: 'data' });
      expect(result.processed).toBe(true);
      expect(result.result).toEqual({ success: true });
    });

    it('should handle processing errors', async () => {
      const event: EventMessage<Record<string, unknown>> = {
        eventId: 'test-event-id',
        eventType: 'TEST_EVENT',
        data: { test: 'data' },
      };

      const error: Error = new Error('Processing failed');
      const handler = jest.fn().mockRejectedValue(error);

      mockProcessedEventRepository.isEventProcessed.mockResolvedValue(false);
      mockProcessedEventRepository.markAsProcessed.mockResolvedValue(undefined);

      const result = await service.processEvent(event, handler);

      expect(result.processed).toBe(false);
      expect(result.error).toBe('Processing failed');
      expect(processedEventRepository.markAsProcessed).toHaveBeenCalledWith(
        'test-event-id',
        'TEST_EVENT',
        { test: 'data' },
        ProcessingResult.FAILED,
        'Processing failed',
      );
    });

    it('should generate event ID if not provided', async () => {
      const event: EventMessage<Record<string, unknown>> = {
        eventType: 'TEST_EVENT',
        data: { test: 'data' },
      };

      mockProcessedEventRepository.isEventProcessed.mockResolvedValue(false);
      mockProcessedEventRepository.markAsProcessed.mockResolvedValue(undefined);

      await service.processEvent(event, async () => {});

      expect(processedEventRepository.isEventProcessed).toHaveBeenCalled();
    });
  });

  describe('isEventProcessed', () => {
    it('should check if event is processed', async () => {
      mockProcessedEventRepository.isEventProcessed.mockResolvedValue(true);

      const result = await service.isEventProcessed('test-event-id');

      expect(processedEventRepository.isEventProcessed).toHaveBeenCalledWith('test-event-id');
      expect(result).toBe(true);
    });
  });

  describe('getEventHistory', () => {
    it('should return event history', async () => {
      const mockEvents = [
        {
          id: '1',
          eventId: 'event-1',
          eventType: 'TEST_EVENT',
          eventData: {},
          createdAt: new Date(),
          createdBy: 'system',
          processingResult: ProcessingResult.SUCCESS,
          errorMessage: null,
        },
      ];

      mockProcessedEventRepository.findByEventType.mockResolvedValue(mockEvents);

      const result = await service.getEventHistory('TEST_EVENT');

      expect(processedEventRepository.findByEventType).toHaveBeenCalledWith('TEST_EVENT', 100);
      expect(result).toEqual(mockEvents);
    });
  });

  describe('cleanupOldEvents', () => {
    it('should cleanup old events', async () => {
      mockProcessedEventRepository.deleteOlderThan.mockResolvedValue(5);

      const result = await service.cleanupOldEvents(30);

      expect(processedEventRepository.deleteOlderThan).toHaveBeenCalledWith(30);
      expect(result).toBe(5);
    });
  });
});
