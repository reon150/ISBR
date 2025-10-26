import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import {
  AdjustInventoryRequestDto,
  InventoryResponseDto,
  InventoryMovementResponseDto,
} from '../dto/inventory';
import { PaginatedResponseDto, PaginationDto } from '../dto/shared/pagination.dto';
import { PaginationQueryDto } from '../dto/shared/pagination-query.dto';
import {
  AdjustInventoryUseCase,
  GetInventoryByProductIdUseCase,
} from '../../application/use-cases/inventory';
import { GetMovementHistoryUseCase } from '../../application/use-cases/movement';
import { AdjustInventoryCommand } from '../../domain/commands/inventory.commands';
import { JwtAuthGuard } from '../../infrastructure/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../infrastructure/auth/guards/roles.guard';
import { Roles } from '../../infrastructure/auth/decorators/roles.decorator';
import { UserRole } from '../../domain/shared/constants';
import { PaginatedResult } from '../../domain/shared/types';
import { Inventory } from '../../domain/entities/inventory.entity';
import { InventoryMovement } from '../../domain/entities/inventory-movement.entity';

@ApiTags('inventory')
@ApiBearerAuth('JWT-auth')
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(
    private readonly adjustInventoryUseCase: AdjustInventoryUseCase,
    private readonly getInventoryByProductIdUseCase: GetInventoryByProductIdUseCase,
    private readonly getMovementHistoryUseCase: GetMovementHistoryUseCase,
    private readonly logger: Logger,
  ) {}

  @Post('adjust')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Adjust inventory',
    description: 'Adjusts inventory levels for a product (IN/OUT movements). Admin only.',
  })
  @ApiResponse({
    status: 200,
    description: 'Inventory adjusted successfully',
    type: InventoryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 422, description: 'Insufficient stock for OUT movement' })
  async adjustInventory(
    @Body() adjustDto: AdjustInventoryRequestDto,
  ): Promise<InventoryResponseDto> {
    this.logger.log(
      `Starting inventory adjustment for productId: ${adjustDto.productId}, type: ${adjustDto.type}, quantity: ${adjustDto.quantity}`,
    );

    const command: AdjustInventoryCommand = new AdjustInventoryCommand(
      adjustDto.productId,
      adjustDto.type,
      adjustDto.quantity,
      adjustDto.reason,
      adjustDto.reference,
    );

    const result: Inventory = await this.adjustInventoryUseCase.execute(command);

    return InventoryResponseDto.fromEntity(result);
  }

  @Get(':productId')
  @ApiOperation({
    summary: 'Get inventory by product',
    description: 'Retrieves current inventory level for a specific product',
  })
  @ApiParam({
    name: 'productId',
    description: 'Product UUID',
    example: 'a7b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d',
  })
  @ApiResponse({
    status: 200,
    description: 'Inventory retrieved successfully',
    type: InventoryResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Inventory not found for this product' })
  async getInventory(@Param('productId') productId: string): Promise<InventoryResponseDto> {
    this.logger.log(`Fetching inventory for productId: ${productId}`);

    const inventory: Inventory = await this.getInventoryByProductIdUseCase.execute(productId);

    return InventoryResponseDto.fromEntity(inventory);
  }

  @Get(':productId/movements')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Get movement history',
    description: 'Retrieves the paginated history of inventory movements for a product',
  })
  @ApiParam({
    name: 'productId',
    description: 'Product UUID',
    example: 'a7b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d',
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
    description: 'Paginated movement history retrieved successfully',
    type: PaginatedResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getMovements(
    @Param('productId') productId: string,
    @Query() paginationQuery: PaginationQueryDto = {},
  ): Promise<PaginatedResponseDto<InventoryMovementResponseDto>> {
    const { page = 1, limit = 10 } = paginationQuery;

    this.logger.log(
      `Fetching movement history for productId: ${productId} - Page: ${page}, Limit: ${limit}`,
    );

    const result: PaginatedResult<InventoryMovement> = await this.getMovementHistoryUseCase.execute(
      productId,
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
      data: result.data.map((movement) => InventoryMovementResponseDto.fromEntity(movement)),
      pagination,
    };
  }
}
