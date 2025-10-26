import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Inventory } from './inventory.entity';
import { MovementType } from '../shared/constants';

@Entity('inventory_movements')
export class InventoryMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'inventory_id' })
  @Index()
  inventoryId: string;

  @ManyToOne(() => Inventory, (inventory) => inventory.movements)
  @JoinColumn({ name: 'inventory_id' })
  inventory: Inventory;

  @Column({
    type: 'enum',
    enum: MovementType,
  })
  type: MovementType;

  @Column({ type: 'bigint' })
  quantity: number;

  @Column({ type: 'bigint', name: 'quantity_before' })
  quantityBefore: number;

  @Column({ type: 'bigint', name: 'quantity_after' })
  quantityAfter: number;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'text', nullable: true })
  reference: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'created_by' })
  createdBy: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;
}
