import { IsString, IsInt, IsEnum, IsOptional, IsPositive, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MovementType } from '../../../../domain/shared/constants';

export class AdjustInventoryRequestDto {
  @ApiProperty({
    description: 'Product ID (UUID)',
    example: 'a7b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d',
  })
  @IsString()
  productId: string;

  @ApiProperty({
    description: 'Quantity to adjust',
    example: 50,
    minimum: 1,
  })
  @IsInt()
  @IsPositive()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Type of inventory movement',
    enum: MovementType,
    example: MovementType.IN,
    enumName: 'MovementType',
  })
  @IsEnum(MovementType)
  type: MovementType;

  @ApiPropertyOptional({
    description: 'Reason for inventory adjustment',
    example: 'Restocking from supplier',
  })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Reference number (PO, invoice, etc.)',
    example: 'PO-2024-001',
  })
  @IsString()
  @IsOptional()
  reference?: string;
}
