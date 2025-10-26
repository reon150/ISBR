export class ProductCreatedEvent {
  constructor(
    public readonly productId: string,
    public readonly name: string,
    public readonly sku: string,
    public readonly categoryId: string,
    public readonly price: number,
    public readonly currency: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

export class ProductUpdatedEvent {
  constructor(
    public readonly productId: string,
    public readonly changes: {
      name?: string;
      price?: number;
      currency?: string;
      category?: string;
      description?: string;
    },
    public readonly timestamp: Date = new Date(),
  ) {}
}

export class ProductDeletedEvent {
  constructor(
    public readonly productId: string,
    public readonly sku: string,
    public readonly deletedBy: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
