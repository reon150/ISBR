import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../shared/pagination-query.dto';
import { Currency } from '../../../../domain/shared/enums';

export class GetAllProductsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter products by category name',
    example: 'Electronics',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Target currency for price conversion',
    enum: Currency,
    example: Currency.USD,
  })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;
}
