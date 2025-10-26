import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { PriceHistory } from '../../../domain/entities/price-history.entity';
import {
  IPriceHistoryRepository,
  PaginationOptions,
  PaginatedResult,
} from '../../../domain/repositories/price-history.repository.interface';

@Injectable()
export class PriceHistoryRepository implements IPriceHistoryRepository {
  constructor(
    @InjectRepository(PriceHistory)
    private readonly repository: Repository<PriceHistory>,
  ) {}

  async create(priceHistory: Partial<PriceHistory>): Promise<PriceHistory> {
    const newPriceHistory: PriceHistory = this.repository.create(priceHistory);
    return this.repository.save(newPriceHistory);
  }

  async findByProductId(productId: string): Promise<PriceHistory[]> {
    return this.repository.find({
      where: { productId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByProductIdPaginated(
    productId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResult<PriceHistory>> {
    const { page, limit, startDate, endDate } = options;
    const skip: number = (page - 1) * limit;

    const whereConditions: Record<string, unknown> = { productId };

    if (startDate && endDate) {
      whereConditions.createdAt = Between(startDate, endDate);
    } else if (startDate) {
      whereConditions.createdAt = Between(startDate, new Date());
    } else if (endDate) {
      whereConditions.createdAt = Between(new Date(0), endDate);
    }

    const total: number = await this.repository.count({ where: whereConditions });

    const data: PriceHistory[] = await this.repository.find({
      where: whereConditions,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const totalPages: number = Math.ceil(total / limit);
    const hasNext: boolean = page < totalPages;
    const hasPrev: boolean = page > 1;

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrev,
    };
  }

  async save(priceHistory: PriceHistory): Promise<PriceHistory> {
    return this.repository.save(priceHistory);
  }
}
