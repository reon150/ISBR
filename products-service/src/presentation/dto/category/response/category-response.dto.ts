import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Category } from '../../../../domain/entities/category.entity';

export class CategoryResponseDto {
  @Exclude()
  deletedAt: Date;

  @Exclude()
  deletedBy: string;
  @ApiProperty({
    description: 'Category ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Category name',
    example: 'Electronics',
  })
  name: string;

  @ApiProperty({
    description: 'Category description',
    example: 'Electronic devices and accessories',
  })
  description: string;

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

  static fromEntity(category: Category): CategoryResponseDto {
    const dto: CategoryResponseDto = new CategoryResponseDto();
    dto.id = category.id;
    dto.name = category.name;
    dto.description = category.description;
    dto.createdAt = category.createdAt;
    dto.updatedAt = category.updatedAt;
    return dto;
  }
}
