import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { InventoryMovement } from './inventory-movement.entity';
import { InsufficientStockException } from '../shared/exceptions/business.exceptions';
import { ErrorCode } from '../shared/constants/error-codes';

@Entity('inventory')
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'product_id', unique: true })
  @Index()
  productId: string;

  @Column({
    type: 'bigint',
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => (typeof value === 'string' ? parseInt(value, 10) : value),
    },
  })
  quantity: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'created_by' })
  createdBy: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'updated_by' })
  updatedBy: string;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @Column({ name: 'deleted_by', nullable: true })
  deletedBy: string;

  @OneToMany(() => InventoryMovement, (movement) => movement.inventory, {
    cascade: true,
  })
  movements: InventoryMovement[];

  adjustQuantity(amount: number, type: 'IN' | 'OUT'): void {
    if (type === 'IN') {
      this.quantity += amount;
    } else if (type === 'OUT') {
      if (this.quantity < amount) {
        throw new InsufficientStockException(
          'Product',
          amount,
          this.quantity,
          ErrorCode.INSUFFICIENT_STOCK,
        );
      }
      this.quantity -= amount;
    }

    if (this.quantity < 0) {
      this.quantity = 0;
    }
  }

  delete(deletedBy: string): void {
    this.deletedAt = new Date();
    this.deletedBy = deletedBy;
    this.updatedBy = deletedBy;
  }

  isDeleted(): boolean {
    return this.deletedAt !== null;
  }
}
