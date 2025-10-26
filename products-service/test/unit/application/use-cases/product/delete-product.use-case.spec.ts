import { Test, TestingModule } from '@nestjs/testing';
import { DeleteProductUseCase } from '@application/use-cases/product/delete-product.use-case';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '@domain/repositories/product.repository.interface';
import {
  IExecutionContext,
  EXECUTION_CONTEXT,
} from '@domain/shared/interfaces/execution-context.interface';
import { NotFoundException } from '@domain/shared/exceptions';
import { ErrorCode } from '@domain/shared/constants/error-codes';
import { DeleteProductCommand } from '@domain/commands/product.commands';
import { mockProduct, mockProductRepository } from '../../../../mocks';

describe('DeleteProductUseCase', () => {
  let useCase: DeleteProductUseCase;
  let productRepository: jest.Mocked<IProductRepository>;
  let executionContext: jest.Mocked<IExecutionContext>;

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    executionContext = {
      getUserId: jest.fn().mockReturnValue('user-1'),
      getUserName: jest.fn().mockReturnValue('Test User'),
      getTimestamp: jest.fn().mockReturnValue(new Date()),
    } as unknown as jest.Mocked<IExecutionContext>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteProductUseCase,
        {
          provide: PRODUCT_REPOSITORY,
          useValue: mockProductRepository,
        },
        {
          provide: EXECUTION_CONTEXT,
          useValue: executionContext,
        },
      ],
    }).compile();

    useCase = module.get<DeleteProductUseCase>(DeleteProductUseCase);
    productRepository = module.get(PRODUCT_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should delete product successfully', async () => {
    productRepository.findById.mockResolvedValue(mockProduct);
    productRepository.save.mockResolvedValue(mockProduct);

    const command = new DeleteProductCommand('1');

    await useCase.execute(command);

    expect(productRepository.findById).toHaveBeenCalledWith('1');
    expect(mockProduct.delete).toHaveBeenCalledWith('user-1');
    expect(productRepository.save).toHaveBeenCalledWith(mockProduct);
  });

  it('should throw NotFoundException when product not found', async () => {
    productRepository.findById.mockResolvedValue(null);

    const command = new DeleteProductCommand('999');

    await expect(useCase.execute(command)).rejects.toThrow(NotFoundException);
    expect(productRepository.findById).toHaveBeenCalledWith('999');
    expect(productRepository.save).not.toHaveBeenCalled();
  });

  it('should handle repository errors', async () => {
    const error = new Error('Database error');
    productRepository.findById.mockRejectedValue(error);

    const command = new DeleteProductCommand('1');

    await expect(useCase.execute(command)).rejects.toThrow('Database error');
    expect(productRepository.findById).toHaveBeenCalledWith('1');
  });
});
