import { Currency } from '../shared/enums';

export class CreateProductCommand {
  constructor(
    public readonly sku: string,
    public readonly name: string,
    public readonly description: string,
    public readonly categoryId: string,
    public readonly price: number,
    public readonly currency: Currency,
  ) {}
}

export class UpdateProductCommand {
  constructor(
    public readonly id: string,
    public readonly name?: string,
    public readonly description?: string,
    public readonly categoryId?: string,
    public readonly price?: number,
    public readonly currency?: Currency,
  ) {}
}

export class DeleteProductCommand {
  constructor(
    public readonly id: string,
    public readonly deletedBy: string,
  ) {}
}
