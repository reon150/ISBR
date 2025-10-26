import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../../../domain/entities/user.entity';

export class UserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User email',
    example: 'user@system.com',
  })
  email: string;

  @ApiProperty({
    description: 'User full name',
    example: 'Jane Smith',
  })
  name: string;

  @ApiProperty({
    description: 'User role',
    example: 'user',
    enum: ['admin', 'user'],
  })
  role: string;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2024-01-10T08:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: Date;

  static fromEntity(entity: User): UserResponseDto {
    const dto: UserResponseDto = new UserResponseDto();
    dto.id = entity.id as string;
    dto.email = entity.email as string;
    dto.name = entity.name as string;
    dto.role = entity.role as string;
    dto.createdAt = entity.createdAt as Date;
    dto.updatedAt = entity.updatedAt as Date;
    return dto;
  }
}
