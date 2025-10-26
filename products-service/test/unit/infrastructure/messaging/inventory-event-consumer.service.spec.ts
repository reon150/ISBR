import { Test, TestingModule } from '@nestjs/testing';
import { InventoryEventConsumer } from '@infrastructure/messaging/inventory-event-consumer.service';
import { KafkaService } from '@infrastructure/messaging/kafka.service';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '@domain/repositories/product.repository.interface';
import { ILoggerService, LOGGER_SERVICE } from '@domain/services/logger.service.interface';
import { Product } from '@domain/entities/product.entity';
import { InventoryAdjustedEvent } from '@domain/integration-events/inventory.integration-events';
import { KafkaTopic } from '@infrastructure/messaging/kafka-topics';

describe('InventoryEventConsumer', () => {
  let service: InventoryEventConsumer;
  let kafkaService: jest.Mocked<KafkaService>;
  let productRepository: jest.Mocked<IProductRepository>;
  let logger: jest.Mocked<ILoggerService>;

  beforeEach(async () => {
    const mockKafkaService = {
      subscribe: jest.fn().mockResolvedValue(undefined),
      startConsumer: jest.fn().mockResolvedValue(undefined),
    };

    const mockProductRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      findBySku: jest.fn(),
      findByCategoryId: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
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
        InventoryEventConsumer,
        {
          provide: KafkaService,
          useValue: mockKafkaService,
        },
        {
          provide: PRODUCT_REPOSITORY,
          useValue: mockProductRepository,
        },
        {
          provide: LOGGER_SERVICE,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<InventoryEventConsumer>(InventoryEventConsumer);
    kafkaService = module.get(KafkaService);
    productRepository = module.get(PRODUCT_REPOSITORY);
    logger = module.get(LOGGER_SERVICE);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should initialize without errors', async () => {
      await service.onModuleInit();

      // The method should complete without throwing errors
      expect(true).toBe(true);
    });
  });

  describe('handleInventoryAdjusted', () => {
    const mockProduct: Product = {
      id: 'product-123',
      sku: 'SKU-123',
      name: 'Test Product',
      description: 'Test Description',
      price: 100,
      currency: 'USD',
      categoryId: 'category-456',
      category: null,
      isActive: true,
      stockQuantity: 50,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user-123',
      updatedBy: 'user-123',
      deletedAt: null,
      deletedBy: null,
      priceHistory: [],
      updatePrice: jest.fn(),
      updateStock: jest.fn(),
      deactivate: jest.fn(),
      activate: jest.fn(),
      canBeDeleted: jest.fn(),
    };

    it('should handle inventory adjusted event successfully', async () => {
      const event: InventoryAdjustedEvent = {
        productId: 'product-123',
        oldQuantity: 50,
        newQuantity: 75,
        movementType: 'IN',
        timestamp: new Date(),
      };

      productRepository.findById.mockResolvedValue(mockProduct);
      productRepository.save.mockResolvedValue(mockProduct);

      // Access the private method through the service instance
      const handleInventoryAdjusted = (service as any).handleInventoryAdjusted.bind(service);
      await handleInventoryAdjusted(event);

      expect(logger.log).toHaveBeenCalledWith(
        'Handling InventoryAdjusted event for product: product-123',
      );
      expect(logger.log).toHaveBeenCalledWith('Quantity changed from 50 to 75 (IN)');
      expect(productRepository.findById).toHaveBeenCalledWith('product-123');
      expect(mockProduct.updateStock).toHaveBeenCalledWith(75);
      expect(productRepository.save).toHaveBeenCalledWith(mockProduct);
      expect(logger.log).toHaveBeenCalledWith('Product product-123 stock updated to 75');
    });

    it('should handle product not found', async () => {
      const event: InventoryAdjustedEvent = {
        productId: 'product-123',
        oldQuantity: 50,
        newQuantity: 75,
        movementType: 'IN',
        timestamp: new Date(),
      };

      productRepository.findById.mockResolvedValue(null);

      const handleInventoryAdjusted = (service as any).handleInventoryAdjusted.bind(service);
      await handleInventoryAdjusted(event);

      expect(logger.log).toHaveBeenCalledWith(
        'Handling InventoryAdjusted event for product: product-123',
      );
      expect(logger.warn).toHaveBeenCalledWith(
        'Product product-123 not found, skipping stock update',
      );
      expect(productRepository.save).not.toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      const event: InventoryAdjustedEvent = {
        productId: 'product-123',
        oldQuantity: 50,
        newQuantity: 75,
        movementType: 'IN',
        timestamp: new Date(),
      };

      const error = new Error('Database connection failed');
      productRepository.findById.mockRejectedValue(error);

      const handleInventoryAdjusted = (service as any).handleInventoryAdjusted.bind(service);
      await handleInventoryAdjusted(event);

      expect(logger.log).toHaveBeenCalledWith(
        'Handling InventoryAdjusted event for product: product-123',
      );
      expect(logger.error).toHaveBeenCalledWith(
        'Error handling InventoryAdjusted event: Database connection failed',
        error.stack,
      );
    });

    it('should handle unknown errors', async () => {
      const event: InventoryAdjustedEvent = {
        productId: 'product-123',
        oldQuantity: 50,
        newQuantity: 75,
        movementType: 'IN',
        timestamp: new Date(),
      };

      productRepository.findById.mockRejectedValue('Unknown error');

      const handleInventoryAdjusted = (service as any).handleInventoryAdjusted.bind(service);
      await handleInventoryAdjusted(event);

      expect(logger.log).toHaveBeenCalledWith(
        'Handling InventoryAdjusted event for product: product-123',
      );
      expect(logger.error).toHaveBeenCalledWith(
        'Error handling InventoryAdjusted event: Unknown error',
        undefined,
      );
    });

    it('should handle OUT movement type', async () => {
      const event: InventoryAdjustedEvent = {
        productId: 'product-123',
        oldQuantity: 50,
        newQuantity: 30,
        movementType: 'OUT',
        timestamp: new Date(),
      };

      productRepository.findById.mockResolvedValue(mockProduct);
      productRepository.save.mockResolvedValue(mockProduct);

      const handleInventoryAdjusted = (service as any).handleInventoryAdjusted.bind(service);
      await handleInventoryAdjusted(event);

      expect(logger.log).toHaveBeenCalledWith('Quantity changed from 50 to 30 (OUT)');
      expect(mockProduct.updateStock).toHaveBeenCalledWith(30);
    });

    it('should handle ADJUSTMENT movement type', async () => {
      const event: InventoryAdjustedEvent = {
        productId: 'product-123',
        oldQuantity: 50,
        newQuantity: 45,
        movementType: 'ADJUSTMENT',
        timestamp: new Date(),
      };

      productRepository.findById.mockResolvedValue(mockProduct);
      productRepository.save.mockResolvedValue(mockProduct);

      const handleInventoryAdjusted = (service as any).handleInventoryAdjusted.bind(service);
      await handleInventoryAdjusted(event);

      expect(logger.log).toHaveBeenCalledWith('Quantity changed from 50 to 45 (ADJUSTMENT)');
      expect(mockProduct.updateStock).toHaveBeenCalledWith(45);
    });

    it('should handle TRANSFER movement type', async () => {
      const event: InventoryAdjustedEvent = {
        productId: 'product-123',
        oldQuantity: 50,
        newQuantity: 40,
        movementType: 'TRANSFER',
        timestamp: new Date(),
      };

      productRepository.findById.mockResolvedValue(mockProduct);
      productRepository.save.mockResolvedValue(mockProduct);

      const handleInventoryAdjusted = (service as any).handleInventoryAdjusted.bind(service);
      await handleInventoryAdjusted(event);

      expect(logger.log).toHaveBeenCalledWith('Quantity changed from 50 to 40 (TRANSFER)');
      expect(mockProduct.updateStock).toHaveBeenCalledWith(40);
    });

    it('should handle save errors', async () => {
      const event: InventoryAdjustedEvent = {
        productId: 'product-123',
        oldQuantity: 50,
        newQuantity: 75,
        movementType: 'IN',
        timestamp: new Date(),
      };

      productRepository.findById.mockResolvedValue(mockProduct);
      productRepository.save.mockRejectedValue(new Error('Save failed'));

      const handleInventoryAdjusted = (service as any).handleInventoryAdjusted.bind(service);
      await handleInventoryAdjusted(event);

      expect(logger.log).toHaveBeenCalledWith(
        'Handling InventoryAdjusted event for product: product-123',
      );
      expect(logger.error).toHaveBeenCalledWith(
        'Error handling InventoryAdjusted event: Save failed',
        expect.any(String),
      );
    });
  });
});
