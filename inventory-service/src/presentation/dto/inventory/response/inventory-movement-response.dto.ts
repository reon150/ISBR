import { ApiProperty } from '@nestjs/swagger';
import { MovementType } from '../../../../domain/shared/constants';
import { InventoryMovement } from '../../../../domain/entities/inventory-movement.entity';

export class InventoryMovementResponseDto {
  @ApiProperty({
    description: 'Movement ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Inventory ID',
    example: 'a7b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d',
  })
  inventoryId: string;

  @ApiProperty({
    description: 'Movement type',
    enum: MovementType,
    example: MovementType.IN,
  })
  type: MovementType;

  @ApiProperty({
    description: 'Quantity moved',
    example: 50,
  })
  quantity: number;

  @ApiProperty({
    description: 'Quantity before movement',
    example: 100,
  })
  quantityBefore: number;

  @ApiProperty({
    description: 'Quantity after movement',
    example: 150,
  })
  quantityAfter: number;

  @ApiProperty({
    description: 'Reason for movement',
    example: 'Restock from supplier',
    required: false,
  })
  reason?: string;

  @ApiProperty({
    description: 'Reference number (e.g., PO number)',
    example: 'PO-2024-001',
    required: false,
  })
  reference?: string;

  @ApiProperty({
    description: 'User ID who created the movement',
    example: '987e6543-e21b-12d3-a456-426614174000',
  })
  createdBy: string;

  @ApiProperty({
    description: 'Movement timestamp',
    example: '2024-01-20T15:45:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Additional metadata',
    example: { source: 'warehouse-A', batch: 'B-2024-001' },
    required: false,
  })
  metadata?: Record<string, unknown>;

  static fromEntity(movement: InventoryMovement): InventoryMovementResponseDto {
    const dto: InventoryMovementResponseDto = new InventoryMovementResponseDto();
    dto.id = movement.id;
    dto.inventoryId = movement.inventoryId;
    dto.type = movement.type;
    dto.quantity = movement.quantity;
    dto.quantityBefore = movement.quantityBefore;
    dto.quantityAfter = movement.quantityAfter;
    dto.reason = movement.reason;
    dto.reference = movement.reference;
    dto.createdBy = movement.createdBy;
    dto.createdAt = movement.createdAt;
    dto.metadata = movement.metadata;
    return dto;
  }
}
