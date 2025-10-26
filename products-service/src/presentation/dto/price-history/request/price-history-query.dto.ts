import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { Currency } from '../../../../domain/shared/enums';
import { PaginationQueryDto } from '../../shared/pagination-query.dto';

export class PriceHistoryQueryDto extends PaginationQueryDto {
  @ApiProperty({
    description: 'Start date for filtering (ISO string)',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'End date for filtering (ISO string)',
    example: '2024-12-31T23:59:59.999Z',
    required: false,
  })
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Target currency for price conversion',
    enum: Currency,
    example: Currency.USD,
  })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;
}
