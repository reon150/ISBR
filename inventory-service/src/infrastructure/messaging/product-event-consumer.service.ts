import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import {
  IInventoryRepository,
  INVENTORY_REPOSITORY,
} from '../../domain/repositories/inventory.repository.interface';
import { ICacheService, CACHE_SERVICE } from '../../domain/services/cache.service.interface';
import { ILoggerService, LOGGER_SERVICE } from '../../domain/services/logger.service.interface';
import {
  IIdempotencyService,
  EventMessage,
} from '../../domain/services/idempotency.service.interface';
import {
  ProductCreatedEvent,
  ProductUpdatedEvent,
  ProductDeletedEvent,
} from '../../domain/integration-events/product.integration-events';
import { KafkaTopic } from './kafka-topics';
import { CACHE_KEYS } from '../cache/cache-keys';
import { Inventory } from '../../domain/entities/inventory.entity';

export const IDEMPOTENCY_SERVICE: string = 'IDEMPOTENCY_SERVICE';

@Injectable()
export class ProductEventConsumer implements OnModuleInit {
  constructor(
    private readonly kafkaService: KafkaService,
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepository: IInventoryRepository,
    @Inject(CACHE_SERVICE)
    private readonly cacheService: ICacheService,
    @Inject(IDEMPOTENCY_SERVICE)
    private readonly idempotencyService: IIdempotencyService,
    @Inject(LOGGER_SERVICE)
    private readonly logger: ILoggerService,
  ) {}

  async onModuleInit() {
    await this.subscribeToProductEvents();
    await this.kafkaService.startConsumer();
  }

  private async subscribeToProductEvents() {
    await this.kafkaService.subscribe<ProductCreatedEvent>(
      KafkaTopic.PRODUCT_CREATED,
      async (data: ProductCreatedEvent) => await this.handleProductCreated(data),
    );

    await this.kafkaService.subscribe<ProductDeletedEvent>(
      KafkaTopic.PRODUCT_DELETED,
      async (data: ProductDeletedEvent) => await this.handleProductDeleted(data),
    );

    await this.kafkaService.subscribe<ProductUpdatedEvent>(
      KafkaTopic.PRODUCT_UPDATED,
      async (data: ProductUpdatedEvent) => await this.handleProductUpdated(data),
    );
  }

  private async handleProductCreated(data: ProductCreatedEvent) {
    const eventMessage: EventMessage<ProductCreatedEvent> = {
      eventId: (data as unknown as { eventId?: string }).eventId || '',
      eventType: KafkaTopic.PRODUCT_CREATED,
      data,
    };

    await this.idempotencyService.processEvent(
      eventMessage,
      async (eventData: ProductCreatedEvent) => {
        this.logger.log(`Handling ProductCreated event for product: ${eventData.productId}`);

        const existing: Inventory | null = await this.inventoryRepository.findByProductId(
          eventData.productId,
        );

        if (existing) {
          this.logger.warn(`Inventory already exists for product: ${eventData.productId}`);
          return;
        }

        await this.inventoryRepository.create({
          productId: eventData.productId,
          quantity: 0,
          createdBy: 'system',
          updatedBy: 'system',
        });

        this.logger.log(`Inventory created for product: ${eventData.productId}`);
      },
    );
  }

  private async handleProductDeleted(data: ProductDeletedEvent) {
    const eventMessage: EventMessage<ProductDeletedEvent> = {
      eventId: (data as unknown as { eventId?: string }).eventId || '',
      eventType: KafkaTopic.PRODUCT_DELETED,
      data,
    };

    await this.idempotencyService.processEvent(
      eventMessage,
      async (eventData: ProductDeletedEvent) => {
        this.logger.log(`Handling ProductDeleted event for product: ${eventData.productId}`);

        const inventory: Inventory | null = await this.inventoryRepository.findByProductId(
          eventData.productId,
        );

        if (!inventory) {
          this.logger.warn(`Inventory not found for product: ${eventData.productId}`);
          return;
        }

        inventory.delete(eventData.deletedBy || 'system');
        await this.inventoryRepository.save(inventory);

        await this.cacheService.del(CACHE_KEYS.INVENTORY_BY_PRODUCT(eventData.productId));

        this.logger.log(`Inventory deactivated for product: ${eventData.productId}`);
      },
    );
  }

  private async handleProductUpdated(data: ProductUpdatedEvent) {
    const eventMessage: EventMessage<ProductUpdatedEvent> = {
      eventId: (data as unknown as { eventId?: string }).eventId || '',
      eventType: KafkaTopic.PRODUCT_UPDATED,
      data,
    };

    await this.idempotencyService.processEvent(
      eventMessage,
      async (eventData: ProductUpdatedEvent) => {
        this.logger.log(`Handling ProductUpdated event for product: ${eventData.productId}`);

        const inventory: Inventory | null = await this.inventoryRepository.findByProductId(
          eventData.productId,
        );

        if (!inventory) {
          this.logger.warn(`Inventory not found for product: ${eventData.productId}`);
          return;
        }

        await this.cacheService.del(CACHE_KEYS.INVENTORY_BY_PRODUCT(eventData.productId));

        this.logger.log(`Inventory updated for product: ${eventData.productId}`);
      },
    );
  }
}
