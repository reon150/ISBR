import { Inject, Injectable } from '@nestjs/common';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '../../../domain/repositories/product.repository.interface';
import {
  IPriceHistoryRepository,
  PRICE_HISTORY_REPOSITORY,
} from '../../../domain/repositories/price-history.repository.interface';
import {
  ICategoryRepository,
  CATEGORY_REPOSITORY,
} from '../../../domain/repositories/category.repository.interface';
import { CreateProductCommand } from '../../../domain/commands/product.commands';
import { Product } from '../../../domain/entities/product.entity';
import { Category } from '../../../domain/entities/category.entity';
import {
  IExecutionContext,
  EXECUTION_CONTEXT,
} from '../../../domain/shared/interfaces/execution-context.interface';
import { AlreadyExistsException, NotFoundException } from '../../../domain/shared/exceptions';
import { ErrorCode } from '../../../domain/shared/constants/error-codes';
import { ProductCreatedEvent } from '../../../domain/events/product.events';
import { ProductEventPublisher } from '../../../infrastructure/messaging/product-event-publisher.service';

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(PRICE_HISTORY_REPOSITORY)
    private readonly priceHistoryRepository: IPriceHistoryRepository,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
    @Inject(EXECUTION_CONTEXT)
    private readonly executionContext: IExecutionContext,
    private readonly productEventPublisher: ProductEventPublisher,
  ) {}

  async execute(command: CreateProductCommand): Promise<Product> {
    const userId: string = this.executionContext.getUserId();

    const existingProduct: Product | null = await this.productRepository.findBySku(command.sku);

    if (existingProduct) {
      throw new AlreadyExistsException('Product', command.sku, ErrorCode.PRODUCT_ALREADY_EXISTS, {
        sku: command.sku,
      });
    }

    const category: Category | null = await this.categoryRepository.findById(command.categoryId);
    if (!category) {
      throw new NotFoundException('Category', command.categoryId, ErrorCode.CATEGORY_NOT_FOUND);
    }

    const product: Product = await this.productRepository.create({
      sku: command.sku,
      name: command.name,
      description: command.description,
      categoryId: command.categoryId,
      price: command.price,
      currency: command.currency,
      stockQuantity: 0,
      createdBy: userId,
      updatedBy: userId,
    });

    await this.priceHistoryRepository.create({
      productId: product.id,
      oldPrice: 0,
      newPrice: product.price,
      createdBy: userId,
    });

    const productCreatedEvent: ProductCreatedEvent = new ProductCreatedEvent(
      product.id,
      product.name,
      product.sku,
      product.categoryId,
      product.price,
      product.currency,
    );
    await this.productEventPublisher.handleProductCreated(productCreatedEvent);

    return product;
  }
}
