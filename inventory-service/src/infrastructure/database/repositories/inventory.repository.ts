import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Inventory } from '../../../domain/entities/inventory.entity';
import { IInventoryRepository } from '../../../domain/repositories/inventory.repository.interface';
import { ErrorCode } from '../../../domain/shared/constants/error-codes';
import { NotFoundException } from '../../../domain/shared/exceptions';

@Injectable()
export class InventoryRepository implements IInventoryRepository {
  constructor(
    @InjectRepository(Inventory)
    private readonly repository: Repository<Inventory>,
  ) {}

  async create(inventory: Partial<Inventory>): Promise<Inventory> {
    const newInventory: Inventory = this.repository.create(inventory);
    return this.repository.save(newInventory);
  }

  async findAll(): Promise<Inventory[]> {
    return this.repository.find({
      where: { deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Inventory | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByProductId(productId: string): Promise<Inventory | null> {
    return this.repository.findOne({ where: { productId, deletedAt: IsNull() } });
  }

  async update(id: string, inventory: Partial<Inventory>): Promise<Inventory> {
    const existing: Inventory | null = await this.findById(id);
    if (!existing) {
      throw new NotFoundException('Inventory', id, ErrorCode.INVENTORY_NOT_FOUND);
    }

    const updated: Inventory = this.repository.merge(existing, inventory);
    return this.repository.save(updated);
  }

  async save(inventory: Inventory): Promise<Inventory> {
    return this.repository.save(inventory);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
