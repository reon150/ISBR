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
  IsNotEmpty,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency } from '../../../../domain/shared/enums';

export class CreateProductRequestDto {
  @ApiProperty({
    description: 'Product name',
    example: 'Dell XPS 15',
    minLength: 3,
    maxLength: 255,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Product description',
    example: 'High-performance laptop for professionals',
    minLength: 10,
  })
  @IsString()
  @MinLength(10)
  description: string;

  @ApiProperty({
    description: 'Product price',
    example: 1500.0,
    minimum: 0.01,
    maximum: 99999999.99,
  })
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  @Max(99999999.99)
  price: number;

  @ApiPropertyOptional({
    description: 'Currency code (ISO 4217)',
    enum: Currency,
    example: Currency.DOP,
    default: Currency.DOP,
  })
  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency = Currency.DOP;

  @ApiProperty({
    description: 'Product category ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  categoryId: string;

  @ApiProperty({
    description: 'Stock Keeping Unit (SKU)',
    example: 'LAPTOP-DELL-XPS15-2024',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  sku: string;
}
