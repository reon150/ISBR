import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { KafkaTopic } from './kafka-topics';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '../../domain/repositories/product.repository.interface';
import { ILoggerService, LOGGER_SERVICE } from '../../domain/services/logger.service.interface';
import { Product } from '../../domain/entities/product.entity';
import { InventoryAdjustedEvent } from '../../domain/integration-events/inventory.integration-events';

@Injectable()
export class InventoryEventConsumer implements OnModuleInit {
  constructor(
    private readonly kafkaService: KafkaService,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(LOGGER_SERVICE)
    private readonly logger: ILoggerService,
  ) {}

  async onModuleInit() {
    setTimeout(async () => {
      try {
        await this.subscribeToInventoryEvents();
        await this.kafkaService.startConsumer();
        this.logger.log('Inventory event consumer started successfully');
      } catch (error) {
        const errorMessage: string = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to start inventory event consumer: ${errorMessage}`);
      }
    }, 10000);
  }

  private async subscribeToInventoryEvents() {
    await this.kafkaService.subscribe<InventoryAdjustedEvent>(
      KafkaTopic.INVENTORY_ADJUSTED,
      async (data: InventoryAdjustedEvent) => await this.handleInventoryAdjusted(data),
    );
  }

  private async handleInventoryAdjusted(data: InventoryAdjustedEvent) {
    try {
      this.logger.log(`Handling InventoryAdjusted event for product: ${data.productId}`);
      this.logger.log(
        `Quantity changed from ${data.oldQuantity} to ${data.newQuantity} (${data.movementType})`,
      );

      const product: Product | null = await this.productRepository.findById(data.productId);

      if (!product) {
        this.logger.warn(`Product ${data.productId} not found, skipping stock update`);
        return;
      }

      product.updateStock(data.newQuantity);
      await this.productRepository.save(product);

      this.logger.log(`Product ${data.productId} stock updated to ${data.newQuantity}`);
    } catch (error) {
      const errorMessage: string = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error handling InventoryAdjusted event: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
