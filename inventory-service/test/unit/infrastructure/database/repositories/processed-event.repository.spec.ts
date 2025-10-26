import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProcessedEventRepository } from '@infrastructure/database/repositories/processed-event.repository';
import { ProcessedEvent } from '@domain/entities/processed-event.entity';
import { ProcessingResult } from '@domain/shared/enums/processing-result.enum';
import { mockProcessedEvent } from '../../../../mocks/domain/entities.mock';

describe('ProcessedEventRepository', () => {
  let repository: ProcessedEventRepository;
  let typeOrmRepository: jest.Mocked<Repository<ProcessedEvent>>;

  beforeEach(async () => {
    const mockTypeOrmRepository = {
      count: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessedEventRepository,
        {
          provide: getRepositoryToken(ProcessedEvent),
          useValue: mockTypeOrmRepository,
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
    it('should return true when event is processed', async () => {
      typeOrmRepository.count.mockResolvedValue(1);
      const result = await repository.isEventProcessed('event-1');
      expect(typeOrmRepository.count).toHaveBeenCalledWith({
        where: { eventId: 'event-1' },
      });
      expect(result).toBe(true);
    });

    it('should return false when event is not processed', async () => {
      typeOrmRepository.count.mockResolvedValue(0);
      const result = await repository.isEventProcessed('event-1');
      expect(typeOrmRepository.count).toHaveBeenCalledWith({
        where: { eventId: 'event-1' },
      });
      expect(result).toBe(false);
    });
  });

  describe('markAsProcessed', () => {
    it('should mark event as processed successfully', async () => {
      const eventData = { productId: 'product-1', quantity: 10 };
      const createdEvent = { ...mockProcessedEvent, eventId: 'event-1' };

      typeOrmRepository.create.mockReturnValue(createdEvent as ProcessedEvent);
      typeOrmRepository.save.mockResolvedValue(createdEvent as ProcessedEvent);

      const result = await repository.markAsProcessed(
        'event-1',
        'ProductCreated',
        eventData,
        ProcessingResult.SUCCESS,
      );

      expect(typeOrmRepository.create).toHaveBeenCalledWith({
        eventId: 'event-1',
        eventType: 'ProductCreated',
        eventData,
        processingResult: ProcessingResult.SUCCESS,
        errorMessage: undefined,
      });
      expect(typeOrmRepository.save).toHaveBeenCalledWith(createdEvent);
      expect(result).toBe(createdEvent);
    });

    it('should mark event as processed with error', async () => {
      const eventData = { productId: 'product-1', quantity: 10 };
      const createdEvent = { ...mockProcessedEvent, eventId: 'event-1' };

      typeOrmRepository.create.mockReturnValue(createdEvent as ProcessedEvent);
      typeOrmRepository.save.mockResolvedValue(createdEvent as ProcessedEvent);

      const result = await repository.markAsProcessed(
        'event-1',
        'ProductCreated',
        eventData,
        ProcessingResult.FAILED,
        'Database error',
      );

      expect(typeOrmRepository.create).toHaveBeenCalledWith({
        eventId: 'event-1',
        eventType: 'ProductCreated',
        eventData,
        processingResult: ProcessingResult.FAILED,
        errorMessage: 'Database error',
      });
      expect(typeOrmRepository.save).toHaveBeenCalledWith(createdEvent);
      expect(result).toBe(createdEvent);
    });
  });

  describe('findByEventId', () => {
    it('should return processed event when found', async () => {
      const foundEvent = { ...mockProcessedEvent, eventId: 'event-1' };
      typeOrmRepository.findOne.mockResolvedValue(foundEvent as ProcessedEvent);

      const result = await repository.findByEventId('event-1');

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { eventId: 'event-1' },
      });
      expect(result).toBe(foundEvent);
    });

    it('should return null when event not found', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findByEventId('non-existent-event');

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { eventId: 'non-existent-event' },
      });
      expect(result).toBeNull();
    });
  });

  describe('findByEventType', () => {
    it('should return processed events by type with default limit', async () => {
      const events = [mockProcessedEvent];
      typeOrmRepository.find.mockResolvedValue(events as ProcessedEvent[]);

      const result = await repository.findByEventType('ProductCreated');

      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { eventType: 'ProductCreated' },
        order: { createdAt: 'DESC' },
        take: 100,
      });
      expect(result).toBe(events);
    });

    it('should return processed events by type with custom limit', async () => {
      const events = [mockProcessedEvent];
      typeOrmRepository.find.mockResolvedValue(events as ProcessedEvent[]);

      const result = await repository.findByEventType('ProductCreated', 50);

      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { eventType: 'ProductCreated' },
        order: { createdAt: 'DESC' },
        take: 50,
      });
      expect(result).toBe(events);
    });
  });

  describe('deleteOlderThan', () => {
    it('should delete events older than specified days', async () => {
      const mockDate = new Date('2023-01-01');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      typeOrmRepository.delete.mockResolvedValue({ affected: 5 });

      const result = await repository.deleteOlderThan(30);

      const expectedDate = new Date('2023-01-01');
      expectedDate.setDate(expectedDate.getDate() - 30);

      expect(typeOrmRepository.delete).toHaveBeenCalledWith({
        createdAt: expect.any(Object),
      });
      expect(result).toBe(5);

      jest.restoreAllMocks();
    });

    it('should return 0 when no events are deleted', async () => {
      const mockDate = new Date('2023-01-01');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      typeOrmRepository.delete.mockResolvedValue({ affected: 0 });

      const result = await repository.deleteOlderThan(30);

      expect(typeOrmRepository.delete).toHaveBeenCalledWith({
        createdAt: expect.any(Object),
      });
      expect(result).toBe(0);

      jest.restoreAllMocks();
    });

    it('should return 0 when affected is null', async () => {
      const mockDate = new Date('2023-01-01');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      typeOrmRepository.delete.mockResolvedValue({ affected: null });

      const result = await repository.deleteOlderThan(30);

      expect(typeOrmRepository.delete).toHaveBeenCalledWith({
        createdAt: expect.any(Object),
      });
      expect(result).toBe(0);

      jest.restoreAllMocks();
    });
  });
});
