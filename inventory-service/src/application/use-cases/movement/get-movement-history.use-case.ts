import { Inject, Injectable } from '@nestjs/common';
import {
  IInventoryMovementRepository,
  INVENTORY_MOVEMENT_REPOSITORY,
} from '../../../domain/repositories/inventory-movement.repository.interface';
import {
  IInventoryRepository,
  INVENTORY_REPOSITORY,
} from '../../../domain/repositories/inventory.repository.interface';
import { InventoryMovement } from '../../../domain/entities/inventory-movement.entity';
import { Inventory } from '../../../domain/entities/inventory.entity';
import { PaginatedResult } from '../../../domain/shared/types';
import { NotFoundException } from '../../../domain/shared/exceptions';
import { ErrorCode } from '../../../domain/shared/constants/error-codes';

@Injectable()
export class GetMovementHistoryUseCase {
  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepository: IInventoryRepository,
    @Inject(INVENTORY_MOVEMENT_REPOSITORY)
    private readonly movementRepository: IInventoryMovementRepository,
  ) {}

  async execute(
    productId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResult<InventoryMovement>> {
    const inventory: Inventory | null = await this.inventoryRepository.findByProductId(productId);

    if (!inventory) {
      throw new NotFoundException('Inventory', productId, ErrorCode.INVENTORY_NOT_FOUND, {
        productId,
      });
    }

    return this.movementRepository.findByInventoryId(inventory.id, page, limit);
  }
}
