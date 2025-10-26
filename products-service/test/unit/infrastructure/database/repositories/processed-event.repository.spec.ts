import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProcessedEventRepository } from '@infrastructure/database/repositories/processed-event.repository';
import { ProcessedEvent } from '@domain/entities/processed-event.entity';
import { ProcessingResult } from '@domain/shared/enums/processing-result.enum';

describe('ProcessedEventRepository', () => {
  let repository: ProcessedEventRepository;
  let typeOrmRepository: jest.Mocked<Repository<ProcessedEvent>>;

  const mockProcessedEvent: ProcessedEvent = {
    id: '1',
    eventId: 'event-1',
    eventType: 'TEST_EVENT',
    eventData: {},
    createdAt: new Date(),
    createdBy: 'system',
    processingResult: ProcessingResult.SUCCESS,
    errorMessage: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessedEventRepository,
        {
          provide: getRepositoryToken(ProcessedEvent),
          useValue: {
            count: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<ProcessedEventRepository>(ProcessedEventRepository);
    typeOrmRepository = module.get(getRepositoryToken(ProcessedEvent));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('isEventProcessed', () => {
    it('should return true if event is processed', async () => {
      typeOrmRepository.count.mockResolvedValue(1);

      const result = await repository.isEventProcessed('event-1');

      expect(typeOrmRepository.count).toHaveBeenCalledWith({ where: { eventId: 'event-1' } });
      expect(result).toBe(true);
    });

    it('should return false if event is not processed', async () => {
      typeOrmRepository.count.mockResolvedValue(0);

      const result = await repository.isEventProcessed('event-1');

      expect(typeOrmRepository.count).toHaveBeenCalledWith({ where: { eventId: 'event-1' } });
      expect(result).toBe(false);
    });
  });

  describe('markAsProcessed', () => {
    it('should mark event as processed successfully', async () => {
      const eventData: Record<string, unknown> = { test: 'data' };

      typeOrmRepository.create.mockReturnValue(mockProcessedEvent);
      typeOrmRepository.save.mockResolvedValue(mockProcessedEvent);

      const result = await repository.markAsProcessed(
        'event-1',
        'TEST_EVENT',
        eventData,
        ProcessingResult.SUCCESS,
      );

      expect(typeOrmRepository.create).toHaveBeenCalled();
      expect(typeOrmRepository.save).toHaveBeenCalled();
      expect(result).toBe(mockProcessedEvent);
    });

    it('should handle error message parameter', async () => {
      const eventData: Record<string, unknown> = { test: 'data' };

      typeOrmRepository.create.mockReturnValue(mockProcessedEvent);
      typeOrmRepository.save.mockResolvedValue(mockProcessedEvent);

      const result = await repository.markAsProcessed(
        'event-1',
        'TEST_EVENT',
        eventData,
        ProcessingResult.SUCCESS,
        'Error message',
      );

      expect(result).toBe(mockProcessedEvent);
    });
  });

  describe('findByEventType', () => {
    it('should find events by type with default limit', async () => {
      const mockEvents: ProcessedEvent[] = [mockProcessedEvent];

      typeOrmRepository.find.mockResolvedValue(mockEvents);

      const result = await repository.findByEventType('TEST_EVENT');

      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { eventType: 'TEST_EVENT' },
        order: { createdAt: 'DESC' },
        take: 100,
      });
      expect(result).toEqual(mockEvents);
    });

    it('should find events by type with custom limit', async () => {
      const mockEvents: ProcessedEvent[] = [mockProcessedEvent];

      typeOrmRepository.find.mockResolvedValue(mockEvents);

      const result = await repository.findByEventType('TEST_EVENT', 50);

      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { eventType: 'TEST_EVENT' },
        order: { createdAt: 'DESC' },
        take: 50,
      });
      expect(result).toEqual(mockEvents);
    });
  });

  describe('deleteOlderThan', () => {
    it('should delete old events successfully', async () => {
      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 5 }),
      };

      typeOrmRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await repository.deleteOlderThan(30);

      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(result).toBe(5);
    });

    it('should return 0 if no events were deleted', async () => {
      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 0 }),
      };

      typeOrmRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await repository.deleteOlderThan(30);

      expect(result).toBe(0);
    });

    it('should return 0 if affected is undefined', async () => {
      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      };

      typeOrmRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await repository.deleteOlderThan(30);

      expect(result).toBe(0);
    });
  });
});
