import { Inject, Injectable } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { InventoryAdjustedEvent } from '../../domain/events/inventory.events';
import { KafkaTopic } from './kafka-topics';
import { ILoggerService, LOGGER_SERVICE } from '../../domain/services/logger.service.interface';

@Injectable()
export class InventoryEventPublisher {
  constructor(
    private readonly kafkaService: KafkaService,
    @Inject(LOGGER_SERVICE) private readonly logger: ILoggerService,
  ) {}

  async publishInventoryAdjusted(event: InventoryAdjustedEvent): Promise<void> {
    this.logger.log(`Publishing InventoryAdjusted event for inventory: ${event.inventoryId}`);

    await this.kafkaService.publish(KafkaTopic.INVENTORY_ADJUSTED, {
      inventoryId: event.inventoryId,
      productId: event.productId,
      oldQuantity: event.oldQuantity,
      newQuantity: event.newQuantity,
      movementType: event.movementType,
      createdBy: event.createdBy,
      timestamp: event.timestamp,
    });
  }
}
