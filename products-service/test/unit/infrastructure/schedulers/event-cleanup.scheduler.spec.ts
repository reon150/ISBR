import { Test, TestingModule } from '@nestjs/testing';
import { EventCleanupScheduler } from '@infrastructure/schedulers/event-cleanup.scheduler';
import {
  IIdempotencyService,
  IDEMPOTENCY_SERVICE,
} from '@domain/services/idempotency.service.interface';
import { ConfigService } from '@nestjs/config';
import { IDEMPOTENCY_SERVICE as IDEMPOTENCY_SERVICE_TOKEN } from '@infrastructure/messaging/idempotency.service';

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

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventCleanupScheduler,
        {
          provide: IDEMPOTENCY_SERVICE_TOKEN,
          useValue: mockIdempotencyService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EventCleanupScheduler>(EventCleanupScheduler);
    idempotencyService = module.get(IDEMPOTENCY_SERVICE_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleEventCleanup', () => {
    it('should cleanup old events successfully', async () => {
      idempotencyService.cleanupOldEvents.mockResolvedValue(5);

      await service.handleEventCleanup();

      expect(idempotencyService.cleanupOldEvents).toHaveBeenCalledWith(30);
    });

    it('should handle cleanup errors gracefully', async () => {
      const error: Error = new Error('Cleanup failed');
      idempotencyService.cleanupOldEvents.mockRejectedValue(error);

      await expect(service.handleEventCleanup()).resolves.not.toThrow();

      expect(idempotencyService.cleanupOldEvents).toHaveBeenCalledWith(30);
    });
  });
});
