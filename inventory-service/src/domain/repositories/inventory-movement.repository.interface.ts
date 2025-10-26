import { InventoryMovement } from '../entities/inventory-movement.entity';

export interface IInventoryMovementRepository {
  create(movement: Partial<InventoryMovement>): Promise<InventoryMovement>;
  findByInventoryId(
    inventoryId: string,
    page?: number,
    limit?: number,
  ): Promise<{ data: InventoryMovement[]; total: number }>;
  findById(id: string): Promise<InventoryMovement | null>;
  save(movement: InventoryMovement): Promise<InventoryMovement>;
}

export const INVENTORY_MOVEMENT_REPOSITORY: string = 'INVENTORY_MOVEMENT_REPOSITORY';
