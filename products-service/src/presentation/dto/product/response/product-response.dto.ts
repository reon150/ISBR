import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency } from '../../../../domain/shared/enums';
import { Exclude } from 'class-transformer';

export class ProductResponseDto {
  @Exclude()
  deletedAt: Date;

  @Exclude()
  deletedBy: string;
  @ApiProperty({
    description: 'Product unique identifier',
    example: 'a7b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d',
  })
  id: string;

  @ApiProperty({
    description: 'Product name',
    example: 'Dell XPS 15',
  })
  name: string;

  @ApiProperty({
    description: 'Product description',
    example: 'High-performance laptop for professionals',
  })
  description: string;

  @ApiProperty({
    description: 'Product price',
    example: 1500.0,
  })
  price: number;

  @ApiProperty({
    description: 'Currency code',
    enum: Currency,
    example: Currency.USD,
  })
  currency: Currency;

  @ApiProperty({
    description: 'Product category ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  categoryId: string;

  @ApiPropertyOptional({
    description: 'Product category name',
    example: 'Electronics',
  })
  categoryName?: string;

  @ApiProperty({
    description: 'Stock quantity',
    example: 10,
  })
  stockQuantity: number;

  @ApiProperty({
    description: 'Stock Keeping Unit',
    example: 'LAPTOP-DELL-XPS15-2024',
  })
  sku: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-10-22T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-10-22T15:45:00.000Z',
  })
  updatedAt: Date;
}
