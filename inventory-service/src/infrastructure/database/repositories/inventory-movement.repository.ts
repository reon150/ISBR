import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryMovement } from '../../../domain/entities/inventory-movement.entity';
import { IInventoryMovementRepository } from '../../../domain/repositories/inventory-movement.repository.interface';

@Injectable()
export class InventoryMovementRepository implements IInventoryMovementRepository {
  constructor(
    @InjectRepository(InventoryMovement)
    private readonly repository: Repository<InventoryMovement>,
  ) {}

  async create(movement: Partial<InventoryMovement>): Promise<InventoryMovement> {
    const newMovement: InventoryMovement = this.repository.create(movement);
    return this.repository.save(newMovement);
  }

  async findByInventoryId(
    inventoryId: string,
    page?: number,
    limit?: number,
  ): Promise<{ data: InventoryMovement[]; total: number }> {
    if (page !== undefined && limit !== undefined) {
      const [data, total] = await this.repository.findAndCount({
        where: { inventoryId },
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });
      return { data, total };
    }

    const data: InventoryMovement[] = await this.repository.find({
      where: { inventoryId },
      order: { createdAt: 'DESC' },
    });
    return { data, total: data.length };
  }

  async findById(id: string): Promise<InventoryMovement | null> {
    return this.repository.findOne({ where: { id } });
  }

  async save(movement: InventoryMovement): Promise<InventoryMovement> {
    return this.repository.save(movement);
  }
}
