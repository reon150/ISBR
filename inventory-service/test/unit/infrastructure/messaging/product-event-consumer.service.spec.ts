import { Test, TestingModule } from '@nestjs/testing';
import { ProductEventConsumer, IDEMPOTENCY_SERVICE } from '@infrastructure/messaging/product-event-consumer.service';
import { KafkaService } from '@infrastructure/messaging/kafka.service';
import {
  IInventoryRepository,
  INVENTORY_REPOSITORY,
} from '@domain/repositories/inventory.repository.interface';
import { ICacheService, CACHE_SERVICE } from '@domain/services/cache.service.interface';
import { ILoggerService, LOGGER_SERVICE } from '@domain/services/logger.service.interface';
import { IIdempotencyService } from '@domain/services/idempotency.service.interface';
import {
  ProductCreatedEvent,
  ProductUpdatedEvent,
  ProductDeletedEvent,
} from '@domain/integration-events/product.integration-events';
import { KafkaTopic } from '@infrastructure/messaging/kafka-topics';
import { Inventory } from '@domain/entities/inventory.entity';

describe('ProductEventConsumer', () => {
  let service: ProductEventConsumer;
  let kafkaService: jest.Mocked<KafkaService>;
  let inventoryRepository: jest.Mocked<IInventoryRepository>;
  let cacheService: jest.Mocked<ICacheService>;
  let idempotencyService: jest.Mocked<IIdempotencyService>;
  let logger: jest.Mocked<ILoggerService>;

  beforeEach(async () => {
    const mockKafkaService = {
      subscribe: jest.fn().mockResolvedValue(undefined),
      startConsumer: jest.fn().mockResolvedValue(undefined),
    };

    const mockInventoryRepository = {
      findByProductId: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    };

    const mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      reset: jest.fn(),
    };

    const mockIdempotencyService = {
      processEvent: jest.fn(),
      generateEventId: jest.fn(),
      cleanupOldEvents: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductEventConsumer,
        {
          provide: KafkaService,
          useValue: mockKafkaService,
        },
        {
          provide: INVENTORY_REPOSITORY,
          useValue: mockInventoryRepository,
        },
        {
          provide: CACHE_SERVICE,
          useValue: mockCacheService,
        },
        {
          provide: IDEMPOTENCY_SERVICE,
          useValue: mockIdempotencyService,
        },
        {
          provide: LOGGER_SERVICE,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<ProductEventConsumer>(ProductEventConsumer);
    kafkaService = module.get(KafkaService);
    inventoryRepository = module.get(INVENTORY_REPOSITORY);
    cacheService = module.get(CACHE_SERVICE);
    idempotencyService = module.get(IDEMPOTENCY_SERVICE);
    logger = module.get(LOGGER_SERVICE);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should subscribe to product events and start consumer', async () => {
      await service.onModuleInit();

      expect(kafkaService.subscribe).toHaveBeenCalledWith(
        KafkaTopic.PRODUCT_CREATED,
        expect.any(Function),
      );
      expect(kafkaService.subscribe).toHaveBeenCalledWith(
        KafkaTopic.PRODUCT_DELETED,
        expect.any(Function),
      );
      expect(kafkaService.subscribe).toHaveBeenCalledWith(
        KafkaTopic.PRODUCT_UPDATED,
        expect.any(Function),
      );
      expect(kafkaService.startConsumer).toHaveBeenCalled();
    });
  });

  describe('handleProductCreated', () => {
    it('should create inventory for new product', async () => {
      const event: ProductCreatedEvent = {
        productId: 'product-123',
        name: 'Test Product',
        sku: 'SKU-123',
        categoryId: 'category-456',
        price: 100,
        currency: 'USD',
        timestamp: new Date(),
      };

      const mockInventory: Inventory = {
        id: 'inventory-123',
        productId: 'product-123',
        quantity: 0,
        reservedQuantity: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        updatedBy: 'system',
        deletedAt: null,
        deletedBy: null,
      };

      idempotencyService.processEvent.mockResolvedValue({
        processed: true,
        result: undefined,
      });

      inventoryRepository.create.mockResolvedValue(mockInventory);
      inventoryRepository.save.mockResolvedValue(mockInventory);

      // Access the private method through the service instance
      const handleProductCreated = (service as any).handleProductCreated.bind(service);
      await handleProductCreated(event);

      expect(idempotencyService.processEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'product.created',
          data: event,
        }),
        expect.any(Function),
      );
    });
  });

  describe('handleProductDeleted', () => {
    it('should delete inventory for deleted product', async () => {
      const event: ProductDeletedEvent = {
        productId: 'product-123',
        sku: 'SKU-123',
        timestamp: new Date(),
      };

      idempotencyService.processEvent.mockResolvedValue({
        processed: true,
        result: undefined,
      });

      // Access the private method through the service instance
      const handleProductDeleted = (service as any).handleProductDeleted.bind(service);
      await handleProductDeleted(event);

      expect(idempotencyService.processEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'product.deleted',
          data: event,
        }),
        expect.any(Function),
      );
    });
  });

  describe('handleProductUpdated', () => {
    it('should handle product update event', async () => {
      const event: ProductUpdatedEvent = {
        productId: 'product-123',
        changes: {
          name: 'Updated Product',
          price: 150,
        },
        timestamp: new Date(),
      };

      idempotencyService.processEvent.mockResolvedValue({
        processed: true,
        result: undefined,
      });

      // Access the private method through the service instance
      const handleProductUpdated = (service as any).handleProductUpdated.bind(service);
      await handleProductUpdated(event);

      expect(idempotencyService.processEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'product.updated',
          data: event,
        }),
        expect.any(Function),
      );
    });
  });
});
