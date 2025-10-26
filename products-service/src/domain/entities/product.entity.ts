import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PriceHistory } from './price-history.entity';
import { Category } from './category.entity';
import { Currency } from '../shared/enums';
import { ValidationException } from '../shared/exceptions';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  @Index()
  name: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({
    type: 'varchar',
    length: 3,
    default: Currency.DOP,
  })
  currency: Currency;

  @Column({ name: 'category_id' })
  @Index()
  categoryId: string;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ length: 100, unique: true })
  @Index()
  sku: string;

  @Column({ name: 'stock_quantity', default: 0 })
  stockQuantity: number;

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

  @OneToMany(() => PriceHistory, (priceHistory) => priceHistory.product, {
    cascade: true,
  })
  priceHistory: PriceHistory[];

  updatePrice(newPrice: number, currency: Currency, updatedBy: string): void {
    if (newPrice <= 0) {
      throw new ValidationException('Price must be greater than zero', undefined, {
        price: newPrice,
      });
    }
    this.price = newPrice;
    this.currency = currency;
    this.updatedBy = updatedBy;
  }

  updateStock(quantity: number): void {
    this.stockQuantity = quantity;
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
