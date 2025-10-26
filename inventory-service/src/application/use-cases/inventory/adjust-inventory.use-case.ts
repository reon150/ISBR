import { Inject, Injectable } from '@nestjs/common';
import {
  IInventoryRepository,
  INVENTORY_REPOSITORY,
} from '../../../domain/repositories/inventory.repository.interface';
import {
  IInventoryMovementRepository,
  INVENTORY_MOVEMENT_REPOSITORY,
} from '../../../domain/repositories/inventory-movement.repository.interface';
import { AdjustInventoryCommand } from '../../../domain/commands/inventory.commands';
import { Inventory } from '../../../domain/entities/inventory.entity';
import { MovementType } from '../../../domain/shared/constants';
import { InventoryAdjustedEvent } from '../../../domain/events/inventory.events';
import { NotFoundException } from '../../../domain/shared/exceptions';
import { ErrorCode } from '../../../domain/shared/constants/error-codes';
import { InventoryEventPublisher } from '../../../infrastructure/messaging/inventory-event-publisher.service';
import {
  IExecutionContext,
  EXECUTION_CONTEXT,
} from '../../../domain/shared/interfaces/execution-context.interface';

@Injectable()
export class AdjustInventoryUseCase {
  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepository: IInventoryRepository,
    @Inject(INVENTORY_MOVEMENT_REPOSITORY)
    private readonly movementRepository: IInventoryMovementRepository,
    @Inject(InventoryEventPublisher)
    private readonly inventoryEventPublisher: InventoryEventPublisher,
    @Inject(EXECUTION_CONTEXT)
    private readonly executionContext: IExecutionContext,
  ) {}

  async execute(command: AdjustInventoryCommand): Promise<Inventory> {
    const userId: string = this.executionContext.getUserId();

    const inventory: Inventory | null = await this.inventoryRepository.findByProductId(
      command.productId,
    );

    if (!inventory) {
      throw new NotFoundException('Inventory', command.productId, ErrorCode.INVENTORY_NOT_FOUND, {
        productId: command.productId,
      });
    }

    const quantityBefore: number = inventory.quantity;

    if (command.type === MovementType.IN || command.type === MovementType.RETURN) {
      inventory.adjustQuantity(command.quantity, MovementType.IN);
    } else if (command.type === MovementType.OUT || command.type === MovementType.DAMAGE) {
      inventory.adjustQuantity(command.quantity, MovementType.OUT);
    }

    const updatedInventory: Inventory = await this.inventoryRepository.save(inventory);

    await this.movementRepository.create({
      inventoryId: inventory.id,
      type: command.type,
      quantity: command.quantity,
      quantityBefore,
      quantityAfter: updatedInventory.quantity,
      reason: command.reason,
      reference: command.reference,
      createdBy: userId,
    });

    const adjustedEvent: InventoryAdjustedEvent = new InventoryAdjustedEvent(
      inventory.id,
      inventory.productId,
      quantityBefore,
      updatedInventory.quantity,
      command.type,
      userId,
    );
    await this.inventoryEventPublisher.publishInventoryAdjusted(adjustedEvent);

    return updatedInventory;
  }
}
