import { Inject, Injectable } from '@nestjs/common';
import {
  IInventoryRepository,
  INVENTORY_REPOSITORY,
} from '../../../domain/repositories/inventory.repository.interface';
import { Inventory } from '../../../domain/entities/inventory.entity';
import { NotFoundException } from '../../../domain/shared/exceptions';
import { ErrorCode } from '../../../domain/shared/constants/error-codes';

@Injectable()
export class GetInventoryByProductIdUseCase {
  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepository: IInventoryRepository,
  ) {}

  async execute(productId: string): Promise<Inventory> {
    const inventory: Inventory | null = await this.inventoryRepository.findByProductId(productId);

    if (!inventory) {
      throw new NotFoundException('Inventory', productId, ErrorCode.INVENTORY_NOT_FOUND, {
        productId,
      });
    }

    return inventory;
  }
}
