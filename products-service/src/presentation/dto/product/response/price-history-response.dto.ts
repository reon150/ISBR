import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PriceHistory } from '../../../../domain/entities/price-history.entity';
import { Currency } from '../../../../domain/shared/enums';

export class PriceHistoryResponseDto {
  @ApiProperty({
    description: 'Price history entry ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Product ID',
    example: 'a7b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d',
  })
  productId: string;

  @ApiProperty({
    description: 'Previous price',
    example: 899.99,
  })
  oldPrice: number;

  @ApiProperty({
    description: 'New price',
    example: 799.99,
  })
  newPrice: number;

  @ApiPropertyOptional({
    description: 'Currency of the prices',
    enum: Currency,
    example: Currency.DOP,
  })
  currency?: Currency;

  @ApiProperty({
    description: 'User ID who made the change',
    example: '987e6543-e21b-12d3-a456-426614174000',
  })
  createdBy: string;

  @ApiProperty({
    description: 'When the price change was recorded',
    example: '2024-01-20T15:45:00.000Z',
  })
  createdAt: Date;

  static fromEntity(entity: PriceHistory, currency?: Currency): PriceHistoryResponseDto {
    const dto: PriceHistoryResponseDto = new PriceHistoryResponseDto();
    dto.id = entity.id;
    dto.productId = entity.productId;
    dto.oldPrice = entity.oldPrice;
    dto.newPrice = entity.newPrice;
    dto.createdBy = entity.createdBy;
    dto.createdAt = entity.createdAt;
    dto.currency = currency;
    return dto;
  }
}
