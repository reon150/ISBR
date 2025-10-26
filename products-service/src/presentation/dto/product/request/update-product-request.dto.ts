import {
  IsString,
  IsNumber,
  IsOptional,
  MinLength,
  MaxLength,
  IsPositive,
  Min,
  Max,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Currency } from '../../../../domain/shared/enums';

export class UpdateProductRequestDto {
  @ApiPropertyOptional({
    description: 'Product name',
    example: 'Dell XPS 15 (Updated)',
    minLength: 3,
    maxLength: 255,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Product description',
    example: 'Updated description for the laptop',
    minLength: 10,
  })
  @IsString()
  @MinLength(10)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Product price',
    example: 1399.99,
    minimum: 0.01,
    maximum: 99999999.99,
  })
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  @Max(99999999.99)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({
    description: 'Currency code (ISO 4217)',
    enum: Currency,
    example: Currency.DOP,
  })
  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency;

  @ApiPropertyOptional({
    description: 'Product category ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsUUID()
  @IsOptional()
  categoryId?: string;
}
