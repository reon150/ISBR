import { Inject, Injectable } from '@nestjs/common';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '../../../domain/repositories/product.repository.interface';
import { Product } from '../../../domain/entities/product.entity';
import { DeleteProductCommand } from '../../../domain/commands/product.commands';
import { NotFoundException } from '../../../domain/shared/exceptions';
import { ErrorCode } from '../../../domain/shared/constants/error-codes';
import {
  IExecutionContext,
  EXECUTION_CONTEXT,
} from '../../../domain/shared/interfaces/execution-context.interface';

@Injectable()
export class DeleteProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(EXECUTION_CONTEXT)
    private readonly executionContext: IExecutionContext,
  ) {}

  async execute(command: DeleteProductCommand): Promise<void> {
    const userId: string = this.executionContext.getUserId();
    const product: Product | null = await this.productRepository.findById(command.id);

    if (!product) {
      throw new NotFoundException('Product', command.id, ErrorCode.PRODUCT_NOT_FOUND);
    }

    product.delete(userId);
    await this.productRepository.save(product);
  }
}
