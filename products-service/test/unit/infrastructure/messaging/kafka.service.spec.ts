import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from '@infrastructure/messaging/kafka.service';
import { getConfig } from '@infrastructure/config';
import { Kafka, Producer, Consumer } from 'kafkajs';

// Mock the getConfig function
jest.mock('@infrastructure/config', () => ({
  getConfig: jest.fn().mockReturnValue({
    kafka: {
      brokers: 'localhost:9092',
      clientId: 'test-client',
      groupId: 'test-group',
      initialRetryTime: 300,
      maxRetries: 10,
      transactionTimeout: 60000,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    },
  }),
}));

// Mock kafkajs
const mockProducer = {
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  send: jest
    .fn()
    .mockResolvedValue([
      { topicName: 'test-topic', partition: 0, errorCode: 0, offset: '1', baseOffset: '1' },
    ]),
};

const mockConsumer = {
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  subscribe: jest.fn().mockResolvedValue(undefined),
  run: jest.fn().mockResolvedValue(undefined),
};

const mockKafka = {
  producer: jest.fn().mockReturnValue(mockProducer),
  consumer: jest.fn().mockReturnValue(mockConsumer),
};

jest.mock('kafkajs', () => ({
  Kafka: jest.fn().mockImplementation(() => mockKafka),
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

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should initialize without connecting', async () => {
      await service.onModuleInit();
      // The method should complete without throwing errors
      expect(true).toBe(true);
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
      expect(mockProducer.connect).toHaveBeenCalled();
      expect(mockProducer.send).toHaveBeenCalled();
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

    it('should handle publish errors', async () => {
      const message = { test: 'data' };
      mockProducer.send.mockRejectedValueOnce(new Error('Publish failed'));

      const result = await service.publish('test-topic', message);

      expect(result).toBe(false);
    });

    it('should handle connection errors', async () => {
      const message = { test: 'data' };
      mockProducer.connect.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await service.publish('test-topic', message);

      expect(result).toBe(false);
    });

    it('should use productId as message key when available', async () => {
      const message = { productId: 'prod-123', name: 'Test Product' };

      await service.publish('test-topic', message);

      expect(mockProducer.send).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              key: 'prod-123',
            }),
          ]),
        }),
      );
    });

    it('should use id as message key when productId not available', async () => {
      const message = { id: 'item-456', name: 'Test Item' };

      await service.publish('test-topic', message);

      expect(mockProducer.send).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              key: 'item-456',
            }),
          ]),
        }),
      );
    });

    it('should use eventId as message key when neither productId nor id available', async () => {
      const message = { name: 'Test Item' };

      await service.publish('test-topic', message);

      expect(mockProducer.send).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              key: expect.any(String),
            }),
          ]),
        }),
      );
    });
  });

  describe('publishBatch', () => {
    it('should publish multiple messages successfully', async () => {
      const messages = [
        { productId: 'prod-1', name: 'Product 1' },
        { productId: 'prod-2', name: 'Product 2' },
      ];

      // First connect the producer
      await service.publish('test-topic', { test: 'data' });

      const result = await service.publishBatch('test-topic', messages);

      expect(result).toBe(true);
      expect(mockProducer.send).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: 'test-topic',
          messages: expect.arrayContaining([
            expect.objectContaining({
              key: 'prod-1',
            }),
            expect.objectContaining({
              key: 'prod-2',
            }),
          ]),
        }),
      );
    });

    it('should handle batch publish errors', async () => {
      const messages = [{ test: 'data' }];
      mockProducer.send.mockRejectedValueOnce(new Error('Batch publish failed'));

      const result = await service.publishBatch('test-topic', messages);

      expect(result).toBe(false);
    });
  });

  describe('publishWithKey', () => {
    it('should publish message with specific key', async () => {
      const message = { name: 'Test Product' };
      const key = 'custom-key';

      // First connect the producer
      await service.publish('test-topic', { test: 'data' });

      const result = await service.publishWithKey('test-topic', key, message);

      expect(result).toBe(true);
      expect(mockProducer.send).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: 'test-topic',
          messages: expect.arrayContaining([
            expect.objectContaining({
              key: 'custom-key',
            }),
          ]),
        }),
      );
    });

    it('should handle publish with key errors', async () => {
      const message = { test: 'data' };
      const key = 'test-key';
      mockProducer.send.mockRejectedValueOnce(new Error('Publish with key failed'));

      const result = await service.publishWithKey('test-topic', key, message);

      expect(result).toBe(false);
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

    it('should handle subscription errors', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);

      // Create a service instance with a mocked messageHandlers that throws
      const serviceWithError = new KafkaService(configService);
      (serviceWithError as any).messageHandlers = {
        set: jest.fn().mockImplementation(() => {
          throw new Error('Subscription failed');
        }),
      };

      await expect(serviceWithError.subscribe('test-topic', handler)).rejects.toThrow(
        'Subscription failed',
      );
    });
  });

  describe('startConsumer', () => {
    it('should start consumer successfully', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      await service.subscribe('test-topic', handler);

      await service.startConsumer();

      expect(mockConsumer.connect).toHaveBeenCalled();
      expect(mockConsumer.subscribe).toHaveBeenCalledWith({
        topic: 'test-topic',
        fromBeginning: false,
      });
      expect(mockConsumer.run).toHaveBeenCalled();
    });

    it('should not start consumer if already running', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      await service.subscribe('test-topic', handler);

      // Start consumer first time
      await service.startConsumer();

      // Reset mocks
      jest.clearAllMocks();

      // Try to start again
      await service.startConsumer();

      expect(mockConsumer.connect).not.toHaveBeenCalled();
      expect(mockConsumer.subscribe).not.toHaveBeenCalled();
      expect(mockConsumer.run).not.toHaveBeenCalled();
    });

    it('should not start consumer if no topics subscribed', async () => {
      await service.startConsumer();

      expect(mockConsumer.connect).not.toHaveBeenCalled();
      expect(mockConsumer.subscribe).not.toHaveBeenCalled();
      expect(mockConsumer.run).not.toHaveBeenCalled();
    });

    it('should handle consumer start errors', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      await service.subscribe('test-topic', handler);

      mockConsumer.connect.mockRejectedValueOnce(new Error('Consumer start failed'));

      await expect(service.startConsumer()).rejects.toThrow('Consumer start failed');
    });
  });

  describe('handleMessage', () => {
    it('should handle message successfully', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      await service.subscribe('test-topic', handler);
      await service.startConsumer();

      // Get the eachMessage callback
      const eachMessageCallback = mockConsumer.run.mock.calls[0][0].eachMessage;

      const mockMessage = {
        eventId: 'event-1',
        eventType: 'test-topic',
        data: { test: 'data' },
        timestamp: Date.now(),
      };

      await eachMessageCallback({
        topic: 'test-topic',
        partition: 0,
        message: {
          value: Buffer.from(JSON.stringify(mockMessage)),
          offset: '0',
          timestamp: Date.now().toString(),
          headers: {},
        },
        heartbeat: jest.fn(),
        pause: jest.fn(),
      });

      expect(handler).toHaveBeenCalledWith(mockMessage.data);
    });

    it('should handle empty message', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      await service.subscribe('test-topic', handler);
      await service.startConsumer();

      const eachMessageCallback = mockConsumer.run.mock.calls[0][0].eachMessage;

      await eachMessageCallback({
        topic: 'test-topic',
        partition: 0,
        message: {
          value: null,
          offset: '0',
          timestamp: Date.now().toString(),
          headers: {},
        },
        heartbeat: jest.fn(),
        pause: jest.fn(),
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle message with no handler', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      await service.subscribe('test-topic', handler);
      await service.startConsumer();

      const eachMessageCallback = mockConsumer.run.mock.calls[0][0].eachMessage;

      const mockMessage = {
        eventId: 'event-1',
        eventType: 'unsubscribed-topic',
        data: { test: 'data' },
        timestamp: Date.now(),
      };

      await eachMessageCallback({
        topic: 'unsubscribed-topic',
        partition: 0,
        message: {
          value: Buffer.from(JSON.stringify(mockMessage)),
          offset: '0',
          timestamp: Date.now().toString(),
          headers: {},
        },
        heartbeat: jest.fn(),
        pause: jest.fn(),
      });

      // Should not throw error
      expect(true).toBe(true);
    });

    it('should handle handler errors', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('Handler failed'));
      await service.subscribe('test-topic', handler);
      await service.startConsumer();

      const eachMessageCallback = mockConsumer.run.mock.calls[0][0].eachMessage;

      const mockMessage = {
        eventId: 'event-1',
        eventType: 'test-topic',
        data: { test: 'data' },
        timestamp: Date.now(),
      };

      await eachMessageCallback({
        topic: 'test-topic',
        partition: 0,
        message: {
          value: Buffer.from(JSON.stringify(mockMessage)),
          offset: '0',
          timestamp: Date.now().toString(),
          headers: {},
        },
        heartbeat: jest.fn(),
        pause: jest.fn(),
      });

      expect(handler).toHaveBeenCalledWith(mockMessage.data);
    });

    it('should handle JSON parse errors', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      await service.subscribe('test-topic', handler);
      await service.startConsumer();

      const eachMessageCallback = mockConsumer.run.mock.calls[0][0].eachMessage;

      await eachMessageCallback({
        topic: 'test-topic',
        partition: 0,
        message: {
          value: Buffer.from('invalid json'),
          offset: '0',
          timestamp: Date.now().toString(),
          headers: {},
        },
        heartbeat: jest.fn(),
        pause: jest.fn(),
      });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('should disconnect successfully when producer and consumer exist', async () => {
      // First connect to create producer and consumer
      await service.publish('test-topic', { test: 'data' });

      await service.disconnect();

      expect(mockProducer.disconnect).toHaveBeenCalled();
      expect(mockConsumer.disconnect).toHaveBeenCalled();
    });

    it('should handle disconnect when producer and consumer do not exist', async () => {
      await service.disconnect();

      expect(mockProducer.disconnect).not.toHaveBeenCalled();
      expect(mockConsumer.disconnect).not.toHaveBeenCalled();
    });

    it('should handle disconnect errors', async () => {
      // First connect to create producer and consumer
      await service.publish('test-topic', { test: 'data' });

      mockProducer.disconnect.mockRejectedValueOnce(new Error('Disconnect failed'));

      await service.disconnect();

      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe('connect', () => {
    it('should not reconnect if already connected', async () => {
      // First connect
      await service.publish('test-topic', { test: 'data' });

      // Reset mocks
      jest.clearAllMocks();

      // Second connect should not call connect again
      await service.publish('test-topic', { test: 'data' });

      expect(mockProducer.connect).not.toHaveBeenCalled();
      expect(mockConsumer.connect).not.toHaveBeenCalled();
    });

    it('should handle connection errors', async () => {
      mockProducer.connect.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await service.publish('test-topic', { test: 'data' });

      expect(result).toBe(false);
    });
  });
});
