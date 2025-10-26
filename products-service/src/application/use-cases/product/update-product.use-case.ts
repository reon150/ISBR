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
import { UpdateProductCommand } from '../../../domain/commands/product.commands';
import { Product } from '../../../domain/entities/product.entity';
import { Category } from '../../../domain/entities/category.entity';
import {
  IExecutionContext,
  EXECUTION_CONTEXT,
} from '../../../domain/shared/interfaces/execution-context.interface';
import { NotFoundException } from '../../../domain/shared/exceptions';
import { ErrorCode } from '../../../domain/shared/constants/error-codes';

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(PRICE_HISTORY_REPOSITORY)
    private readonly priceHistoryRepository: IPriceHistoryRepository,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
    @Inject(EXECUTION_CONTEXT)
    private readonly executionContext: IExecutionContext,
  ) {}

  async execute(command: UpdateProductCommand): Promise<Product> {
    const userId: string = this.executionContext.getUserId();

    const product: Product | null = await this.productRepository.findById(command.id);

    if (!product) {
      throw new NotFoundException('Product', command.id, ErrorCode.PRODUCT_NOT_FOUND);
    }

    if (command.categoryId) {
      const category: Category | null = await this.categoryRepository.findById(command.categoryId);
      if (!category) {
        throw new NotFoundException('Category', command.categoryId, ErrorCode.CATEGORY_NOT_FOUND);
      }
    }

    const oldPrice: number = product.price;

    const priceChanged: boolean = command.price !== undefined && command.price !== product.price;

    const updatedProduct: Product = await this.productRepository.update(command.id, {
      name: command.name,
      description: command.description,
      categoryId: command.categoryId,
      price: command.price,
      currency: command.currency,
      updatedBy: userId,
    });

    if (priceChanged && command.price !== undefined) {
      await this.priceHistoryRepository.create({
        productId: product.id,
        oldPrice,
        newPrice: command.price,
        createdBy: userId,
      });
    }

    return updatedProduct;
  }
}
