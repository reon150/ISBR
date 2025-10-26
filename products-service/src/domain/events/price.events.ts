export class PriceChangedEvent {
  constructor(
    public readonly productId: string,
    public readonly oldPrice: number,
    public readonly newPrice: number,
    public readonly currency: string,
    public readonly createdBy: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
