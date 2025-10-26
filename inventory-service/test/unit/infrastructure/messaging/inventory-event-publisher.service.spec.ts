import { Test, TestingModule } from '@nestjs/testing';
import { InventoryEventPublisher } from '@infrastructure/messaging/inventory-event-publisher.service';
import { KafkaService } from '@infrastructure/messaging/kafka.service';
import { ILoggerService, LOGGER_SERVICE } from '@domain/services/logger.service.interface';
import { InventoryAdjustedEvent } from '@domain/events/inventory.events';
import { MovementType } from '@domain/shared/constants';
import { KafkaTopic } from '@infrastructure/messaging/kafka-topics';
import { mockKafkaService, mockLoggerService } from '../../../mocks';

describe('InventoryEventPublisher', () => {
  let service: InventoryEventPublisher;
  let kafkaService: jest.Mocked<KafkaService>;
  let logger: jest.Mocked<ILoggerService>;

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryEventPublisher,
        {
          provide: KafkaService,
          useValue: mockKafkaService,
        },
        {
          provide: LOGGER_SERVICE,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<InventoryEventPublisher>(InventoryEventPublisher);
    kafkaService = module.get(KafkaService);
    logger = module.get(LOGGER_SERVICE);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should publish inventory adjusted event successfully', async () => {
    kafkaService.publish.mockResolvedValue(undefined);

    const event: InventoryAdjustedEvent = new InventoryAdjustedEvent(
      'inventory-1',
      'product-1',
      50,
      60,
      MovementType.IN,
      'user-1',
    );

    await service.publishInventoryAdjusted(event);

    expect(logger.log).toHaveBeenCalledWith(
      'Publishing InventoryAdjusted event for inventory: inventory-1',
    );
    expect(kafkaService.publish).toHaveBeenCalledWith(KafkaTopic.INVENTORY_ADJUSTED, {
      inventoryId: 'inventory-1',
      productId: 'product-1',
      oldQuantity: 50,
      newQuantity: 60,
      movementType: MovementType.IN,
      createdBy: 'user-1',
      timestamp: event.timestamp,
    });
  });

  it('should handle kafka service errors', async () => {
    const error: Error = new Error('Kafka publish error');
    kafkaService.publish.mockRejectedValue(error);

    const event: InventoryAdjustedEvent = new InventoryAdjustedEvent(
      'inventory-1',
      'product-1',
      50,
      60,
      MovementType.IN,
      'user-1',
    );

    await expect(service.publishInventoryAdjusted(event)).rejects.toThrow('Kafka publish error');
    expect(logger.log).toHaveBeenCalledWith(
      'Publishing InventoryAdjusted event for inventory: inventory-1',
    );
    expect(kafkaService.publish).toHaveBeenCalledWith(KafkaTopic.INVENTORY_ADJUSTED, {
      inventoryId: 'inventory-1',
      productId: 'product-1',
      oldQuantity: 50,
      newQuantity: 60,
      movementType: MovementType.IN,
      createdBy: 'user-1',
      timestamp: event.timestamp,
    });
  });
});
