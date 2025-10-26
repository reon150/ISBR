import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import {
  UpdateProductRequestDto,
  CreateProductRequestDto,
  ProductResponseDto,
  PriceHistoryResponseDto,
} from '../dto/product';
import { GetAllProductsQueryDto } from '../dto/product/request/get-all-products-query.dto';
import { PriceHistoryQueryDto } from '../dto/price-history/request/price-history-query.dto';
import { PaginatedResponseDto, PaginationDto } from '../dto/shared/pagination.dto';
import {
  CreateProductUseCase,
  GetAllProductsUseCase,
  GetProductByIdUseCase,
  UpdateProductUseCase,
  DeleteProductUseCase,
} from '../../application/use-cases/product';
import { GetPriceHistoryUseCase } from '../../application/use-cases/price';
import {
  UpdateProductCommand,
  DeleteProductCommand,
  CreateProductCommand,
} from '../../domain/commands/product.commands';
import { JwtAuthGuard } from '../../infrastructure/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../infrastructure/auth/guards/roles.guard';
import { Roles } from '../../infrastructure/auth/decorators/roles.decorator';
import { UserRole, Currency } from '../../domain/shared/enums';
import { PaginatedResult } from '../../domain/shared/types';
import { Product } from '../../domain/entities/product.entity';
import { PriceHistory } from '../../domain/entities/price-history.entity';

@ApiTags('products')
@ApiBearerAuth('JWT-auth')
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly getAllProductsUseCase: GetAllProductsUseCase,
    private readonly getProductByIdUseCase: GetProductByIdUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
    private readonly getPriceHistoryUseCase: GetPriceHistoryUseCase,
    private readonly logger: Logger,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new product',
    description: 'Creates a new product (Admin only)',
  })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 409, description: 'Conflict - Product with same SKU already exists' })
  async create(@Body() createProductDto: CreateProductRequestDto): Promise<ProductResponseDto> {
    this.logger.log(`Creating product: ${createProductDto.name}`);

    const command: CreateProductCommand = new CreateProductCommand(
      createProductDto.sku,
      createProductDto.name,
      createProductDto.description,
      createProductDto.categoryId,
      createProductDto.price,
      createProductDto.currency || Currency.DOP,
    );

    const product: Product = await this.createProductUseCase.execute(command);

    return plainToInstance(ProductResponseDto, product);
  }

  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Get all products',
    description:
      'Retrieves all products with optional filtering by category, currency conversion, and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of products retrieved successfully',
    type: PaginatedResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async findAll(
    @Query() query: GetAllProductsQueryDto = {},
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    const page: number = query.page ?? 1;
    const limit: number = query.limit ?? 10;
    const category: string | undefined = query.category;
    const currency: Currency | undefined = query.currency;

    this.logger.log(
      `Fetching products${category ? ` by category: ${category}` : ''}${currency ? ` with currency: ${currency}` : ''} - Page: ${page}, Limit: ${limit}`,
    );

    const result: PaginatedResult<Product> = await this.getAllProductsUseCase.execute(
      category,
      currency,
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
      data: result.data.map((p) => plainToInstance(ProductResponseDto, p)),
      pagination,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get product by ID',
    description: 'Retrieves a single product by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    example: 'a7b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d',
  })
  @ApiQuery({
    name: 'currency',
    required: false,
    description: 'Target currency for price conversion',
    enum: Currency,
    example: Currency.DOP,
  })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(
    @Param('id') id: string,
    @Query('currency') currency?: Currency,
  ): Promise<ProductResponseDto> {
    this.logger.log(
      `Fetching product by id: ${id}${currency ? ` with currency: ${currency}` : ''}`,
    );

    const product: Product = await this.getProductByIdUseCase.execute(id, currency);

    return plainToInstance(ProductResponseDto, product);
  }

  @Get(':id/price-history')
  @Roles(UserRole.ADMIN)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Get price history',
    description:
      'Retrieves the price change history for a product with pagination support (Admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    example: 'a7b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d',
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page',
    required: false,
    example: 10,
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Start date for filtering (ISO string)',
    required: false,
    example: '2024-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'endDate',
    description: 'End date for filtering (ISO string)',
    required: false,
    example: '2024-12-31T23:59:59.999Z',
  })
  @ApiQuery({
    name: 'currency',
    required: false,
    description: 'Target currency for price conversion',
    enum: Currency,
    example: Currency.DOP,
  })
  @ApiResponse({
    status: 200,
    description: 'Price history retrieved successfully',
    type: PaginatedResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid pagination parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getPriceHistory(
    @Param('id') id: string,
    @Query() query: PriceHistoryQueryDto,
  ): Promise<PaginatedResponseDto<PriceHistoryResponseDto>> {
    this.logger.log(
      `Fetching price history for product id: ${id}${query.currency ? ` with currency: ${query.currency}` : ''}`,
    );

    const options: {
      page: number;
      limit: number;
      startDate?: Date;
      endDate?: Date;
      currency?: Currency;
    } = {
      page: query.page || 1,
      limit: query.limit || 10,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      currency: query.currency,
    };

    const result: PaginatedResult<PriceHistory> = await this.getPriceHistoryUseCase.execute(
      id,
      options,
    );

    const totalPages: number = Math.ceil(result.total / options.limit);

    return {
      data: result.data.map((entry) => PriceHistoryResponseDto.fromEntity(entry, options.currency)),
      pagination: {
        page: options.page,
        limit: options.limit,
        total: result.total,
        totalPages,
        hasNext: options.page < totalPages,
        hasPrev: options.page > 1,
      },
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update product',
    description: 'Updates an existing product (Admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    example: 'a7b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d',
  })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductRequestDto,
  ): Promise<ProductResponseDto> {
    this.logger.log(`Updating product with id: ${id}`);

    const command: UpdateProductCommand = new UpdateProductCommand(
      id,
      updateProductDto.name,
      updateProductDto.description,
      updateProductDto.categoryId,
      updateProductDto.price,
      updateProductDto.currency,
    );

    const product: Product = await this.updateProductUseCase.execute(command);

    return plainToInstance(ProductResponseDto, product);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete product',
    description: 'Soft deletes a product (sets deletedAt and deletedBy) (Admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    example: 'a7b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d',
  })
  @ApiResponse({ status: 204, description: 'Product deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async remove(@Param('id') id: string) {
    this.logger.log(`Deleting product with id: ${id}`);

    const command: DeleteProductCommand = new DeleteProductCommand(id, '');

    await this.deleteProductUseCase.execute(command);
  }
}
