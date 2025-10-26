import { Inventory } from '../entities/inventory.entity';

export interface IInventoryRepository {
  create(inventory: Partial<Inventory>): Promise<Inventory>;
  findAll(): Promise<Inventory[]>;
  findById(id: string): Promise<Inventory | null>;
  findByProductId(productId: string): Promise<Inventory | null>;
  update(id: string, inventory: Partial<Inventory>): Promise<Inventory>;
  save(inventory: Inventory): Promise<Inventory>;
  delete(id: string): Promise<void>;
}

export const INVENTORY_REPOSITORY: string = 'INVENTORY_REPOSITORY';
