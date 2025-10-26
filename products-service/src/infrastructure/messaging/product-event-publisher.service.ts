import { Inject, Injectable } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import {
  ProductCreatedEvent,
  ProductUpdatedEvent,
  ProductDeletedEvent,
} from '../../domain/events/product.events';
import { PriceChangedEvent } from '../../domain/events/price.events';
import { KafkaTopic } from './kafka-topics';
import { ILoggerService, LOGGER_SERVICE } from '../../domain/services/logger.service.interface';

@Injectable()
export class ProductEventPublisher {
  constructor(
    private readonly kafkaService: KafkaService,
    @Inject(LOGGER_SERVICE) private readonly logger: ILoggerService,
  ) {}

  async handleProductCreated(event: ProductCreatedEvent) {
    this.logger.log(`Publishing ProductCreated event for product: ${event.productId}`);

    await this.kafkaService.publish(KafkaTopic.PRODUCT_CREATED, {
      productId: event.productId,
      name: event.name,
      sku: event.sku,
      categoryId: event.categoryId,
      price: event.price,
      currency: event.currency,
      timestamp: event.timestamp,
    });
  }

  async handleProductUpdated(event: ProductUpdatedEvent) {
    this.logger.log(`Publishing ProductUpdated event for product: ${event.productId}`);

    await this.kafkaService.publish(KafkaTopic.PRODUCT_UPDATED, {
      productId: event.productId,
      changes: event.changes,
      timestamp: event.timestamp,
    });
  }

  async handleProductDeleted(event: ProductDeletedEvent) {
    this.logger.log(`Publishing ProductDeleted event for product: ${event.productId}`);

    await this.kafkaService.publish(KafkaTopic.PRODUCT_DELETED, {
      productId: event.productId,
      sku: event.sku,
      deletedBy: event.deletedBy,
      timestamp: event.timestamp,
    });
  }

  async handlePriceChanged(event: PriceChangedEvent) {
    this.logger.log(`Publishing PriceChanged event for product: ${event.productId}`);

    await this.kafkaService.publish(KafkaTopic.PRODUCT_PRICE_CHANGED, {
      productId: event.productId,
      oldPrice: event.oldPrice,
      newPrice: event.newPrice,
      currency: event.currency,
      createdBy: event.createdBy,
      timestamp: event.timestamp,
    });
  }
}
