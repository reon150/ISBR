import { Test, TestingModule } from '@nestjs/testing';
import { ProductEventPublisher } from '@infrastructure/messaging/product-event-publisher.service';
import { KafkaService } from '@infrastructure/messaging/kafka.service';
import { ILoggerService, LOGGER_SERVICE } from '@domain/services/logger.service.interface';
import {
  ProductCreatedEvent,
  ProductUpdatedEvent,
  ProductDeletedEvent,
} from '@domain/events/product.events';
import { PriceChangedEvent } from '@domain/events/price.events';
import { KafkaTopic } from '@infrastructure/messaging/kafka-topics';

describe('ProductEventPublisher', () => {
  let service: ProductEventPublisher;
  let kafkaService: jest.Mocked<KafkaService>;
  let logger: jest.Mocked<ILoggerService>;

  beforeEach(async () => {
    const mockKafkaService = {
      publish: jest.fn().mockResolvedValue(undefined),
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
        ProductEventPublisher,
        {
          provide: KafkaService,
          useValue: mockKafkaService,
        },
        {
          provide: LOGGER_SERVICE,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<ProductEventPublisher>(ProductEventPublisher);
    kafkaService = module.get(KafkaService);
    logger = module.get(LOGGER_SERVICE);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleProductCreated', () => {
    it('should publish product created event', async () => {
      const event: ProductCreatedEvent = {
        productId: 'product-123',
        name: 'Test Product',
        sku: 'SKU-123',
        categoryId: 'category-456',
        price: 100,
        currency: 'USD',
        timestamp: new Date(),
      };

      await service.handleProductCreated(event);

      expect(logger.log).toHaveBeenCalledWith(
        'Publishing ProductCreated event for product: product-123',
      );
      expect(kafkaService.publish).toHaveBeenCalledWith(KafkaTopic.PRODUCT_CREATED, {
        productId: 'product-123',
        name: 'Test Product',
        sku: 'SKU-123',
        categoryId: 'category-456',
        price: 100,
        currency: 'USD',
        timestamp: event.timestamp,
      });
    });
  });

  describe('handleProductUpdated', () => {
    it('should publish product updated event', async () => {
      const event: ProductUpdatedEvent = {
        productId: 'product-123',
        changes: {
          name: 'Updated Product',
          price: 150,
        },
        timestamp: new Date(),
      };

      await service.handleProductUpdated(event);

      expect(logger.log).toHaveBeenCalledWith(
        'Publishing ProductUpdated event for product: product-123',
      );
      expect(kafkaService.publish).toHaveBeenCalledWith(KafkaTopic.PRODUCT_UPDATED, {
        productId: 'product-123',
        changes: {
          name: 'Updated Product',
          price: 150,
        },
        timestamp: event.timestamp,
      });
    });
  });

  describe('handleProductDeleted', () => {
    it('should publish product deleted event', async () => {
      const event: ProductDeletedEvent = {
        productId: 'product-123',
        sku: 'SKU-123',
        timestamp: new Date(),
      };

      await service.handleProductDeleted(event);

      expect(logger.log).toHaveBeenCalledWith(
        'Publishing ProductDeleted event for product: product-123',
      );
      expect(kafkaService.publish).toHaveBeenCalledWith(KafkaTopic.PRODUCT_DELETED, {
        productId: 'product-123',
        sku: 'SKU-123',
        timestamp: event.timestamp,
      });
    });
  });

  describe('handlePriceChanged', () => {
    it('should publish price changed event', async () => {
      const event: PriceChangedEvent = {
        productId: 'product-123',
        oldPrice: 100,
        newPrice: 150,
        currency: 'USD',
        createdBy: 'user-456',
        timestamp: new Date(),
      };

      await service.handlePriceChanged(event);

      expect(logger.log).toHaveBeenCalledWith(
        'Publishing PriceChanged event for product: product-123',
      );
      expect(kafkaService.publish).toHaveBeenCalledWith(KafkaTopic.PRODUCT_PRICE_CHANGED, {
        productId: 'product-123',
        oldPrice: 100,
        newPrice: 150,
        currency: 'USD',
        createdBy: 'user-456',
        timestamp: event.timestamp,
      });
    });
  });

  describe('error handling', () => {
    it('should handle kafka publish errors', async () => {
      const event: ProductCreatedEvent = {
        productId: 'product-123',
        name: 'Test Product',
        sku: 'SKU-123',
        categoryId: 'category-456',
        price: 100,
        currency: 'USD',
        timestamp: new Date(),
      };

      kafkaService.publish.mockRejectedValue(new Error('Kafka error'));

      await expect(service.handleProductCreated(event)).rejects.toThrow('Kafka error');
    });
  });
});
