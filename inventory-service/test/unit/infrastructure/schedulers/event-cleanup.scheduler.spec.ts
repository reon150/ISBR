import { Test, TestingModule } from '@nestjs/testing';
import { EventCleanupScheduler } from '@infrastructure/schedulers/event-cleanup.scheduler';
import { IIdempotencyService } from '@domain/services/idempotency.service.interface';
import { IDEMPOTENCY_SERVICE } from '@infrastructure/messaging/product-event-consumer.service';
import { ConfigService } from '@nestjs/config';

// Mock the getConfig function
jest.mock('@infrastructure/config', () => ({
  getConfig: jest.fn().mockReturnValue({
    scheduler: {
      eventRetentionDays: 30,
      eventCleanupCron: '0 2 * * *',
    },
  }),
}));

describe('EventCleanupScheduler', () => {
  let service: EventCleanupScheduler;
  let idempotencyService: jest.Mocked<IIdempotencyService>;

  beforeEach(async () => {
    const mockIdempotencyService: jest.Mocked<IIdempotencyService> = {
      generateEventId: jest.fn(),
      processEvent: jest.fn(),
      isEventProcessed: jest.fn(),
      getEventHistory: jest.fn(),
      cleanupOldEvents: jest.fn(),
    } as jest.Mocked<IIdempotencyService>;

    const mockConfigService: jest.Mocked<ConfigService> = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventCleanupScheduler,
        {
          provide: IDEMPOTENCY_SERVICE,
          useValue: mockIdempotencyService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EventCleanupScheduler>(EventCleanupScheduler);
    idempotencyService = module.get(IDEMPOTENCY_SERVICE);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleEventCleanup', () => {
    it('should cleanup old events successfully', async () => {
      idempotencyService.cleanupOldEvents.mockResolvedValue(0);

      await service.handleEventCleanup();

      expect(idempotencyService.cleanupOldEvents).toHaveBeenCalledWith(30);
    });

    it('should handle cleanup errors gracefully', async () => {
      const error: Error = new Error('Cleanup failed');
      idempotencyService.cleanupOldEvents.mockRejectedValue(error);

      // Should not throw
      await expect(service.handleEventCleanup()).resolves.not.toThrow();

      expect(idempotencyService.cleanupOldEvents).toHaveBeenCalledWith(30);
    });
  });

});
