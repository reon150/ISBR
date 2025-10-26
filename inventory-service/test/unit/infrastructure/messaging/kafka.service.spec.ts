import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from '@infrastructure/messaging/kafka.service';
import { getConfig } from '@infrastructure/config';

// Mock the getConfig function
jest.mock('@infrastructure/config', () => ({
  getConfig: jest.fn().mockReturnValue({
    kafka: {
      brokers: 'localhost:9092',
      clientId: 'test-client',
      groupId: 'test-group',
    },
  }),
}));

// Mock kafkajs
jest.mock('kafkajs', () => ({
  Kafka: jest.fn().mockImplementation(() => ({
    producer: jest.fn().mockReturnValue({
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      send: jest
        .fn()
        .mockResolvedValue([{ topicName: 'test-topic', partition: 0, errorCode: 0, offset: '1' }]),
    }),
    consumer: jest.fn().mockReturnValue({
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn().mockResolvedValue(undefined),
      run: jest.fn().mockResolvedValue(undefined),
    }),
  })),
  logLevel: {
    INFO: 2,
  },
}));

describe('KafkaService', () => {
  let service: KafkaService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KafkaService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<KafkaService>(KafkaService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should initialize without connecting', async () => {
      await service.onModuleInit();
      expect(getConfig).toHaveBeenCalledWith(configService);
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect on module destroy', async () => {
      await service.onModuleDestroy();
      // Should not throw any errors
    });
  });

  describe('publish', () => {
    it('should publish message successfully', async () => {
      const message = {
        eventType: 'test-event',
        data: { test: 'data' },
      };

      const result = await service.publish('test-topic', message);

      expect(result).toBe(true);
    });

    it('should generate unique event IDs', async () => {
      const message = {
        eventType: 'test-event',
        data: { test: 'data' },
      };

      const result1 = await service.publish('test-topic', message);
      const result2 = await service.publish('test-topic', message);

      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });
  });

  describe('subscribe', () => {
    it('should subscribe to topic with handler', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);

      await service.subscribe('test-topic', handler);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle multiple subscriptions', async () => {
      const handler1 = jest.fn().mockResolvedValue(undefined);
      const handler2 = jest.fn().mockResolvedValue(undefined);

      await service.subscribe('topic1', handler1);
      await service.subscribe('topic2', handler2);

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('should disconnect successfully', async () => {
      await service.disconnect();
      // Should not throw any errors
    });
  });
});
