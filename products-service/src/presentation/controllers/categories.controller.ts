import { Controller, Get, UseGuards, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@infrastructure/auth/guards/jwt-auth.guard';
import { GetAllCategoriesUseCase } from '@application/use-cases/category';
import { CategoryResponseDto } from '../dto/category/response/category-response.dto';
import { PaginatedResponseDto, PaginationDto } from '../dto/shared/pagination.dto';
import { PaginationQueryDto } from '../dto/shared/pagination-query.dto';
import { plainToInstance } from 'class-transformer';
import { Category } from '@domain/entities/category.entity';

@ApiTags('Categories')
@Controller('categories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CategoriesController {
  constructor(private readonly getAllCategoriesUseCase: GetAllCategoriesUseCase) {}

  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Get all categories',
    description: 'Retrieves all available product categories with pagination support',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated categories retrieved successfully',
    type: PaginatedResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async findAll(
    @Query() paginationQuery: PaginationQueryDto = {},
  ): Promise<PaginatedResponseDto<CategoryResponseDto>> {
    const { page = 1, limit = 10 } = paginationQuery;

    const result: { data: Category[]; total: number } = await this.getAllCategoriesUseCase.execute(
      page,
      limit,
    );

    const totalPages: number = Math.ceil(result.total / limit);
    const pagination: PaginationDto = {
      page,
      limit,
      total: result.total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    return {
      data: result.data.map((category) => plainToInstance(CategoryResponseDto, category)),
      pagination,
    };
  }
}
