import { ApiProperty } from '@nestjs/swagger';
import { Inventory } from '../../../../domain/entities/inventory.entity';

export class InventoryResponseDto {
  @ApiProperty({
    description: 'Inventory ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Product ID',
    example: 'a7b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d',
  })
  productId: string;

  @ApiProperty({
    description: 'Total quantity in inventory',
    example: 100,
  })
  quantity: number;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-20T15:45:00.000Z',
  })
  updatedAt: Date;

  static fromEntity(inventory: Inventory): InventoryResponseDto {
    const dto: InventoryResponseDto = new InventoryResponseDto();
    dto.id = inventory.id;
    dto.productId = inventory.productId;
    dto.quantity = inventory.quantity;
    dto.createdAt = inventory.createdAt;
    dto.updatedAt = inventory.updatedAt;
    return dto;
  }
}
