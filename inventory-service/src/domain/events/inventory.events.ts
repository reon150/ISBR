export class InventoryCreatedEvent {
  constructor(
    public readonly inventoryId: string,
    public readonly productId: string,
    public readonly productSku: string,
    public readonly initialQuantity: number,
    public readonly timestamp: Date = new Date(),
  ) {}
}

export class InventoryAdjustedEvent {
  constructor(
    public readonly inventoryId: string,
    public readonly productId: string,
    public readonly oldQuantity: number,
    public readonly newQuantity: number,
    public readonly movementType: string,
    public readonly createdBy: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

export class LowStockAlertEvent {
  constructor(
    public readonly inventoryId: string,
    public readonly productId: string,
    public readonly productSku: string,
    public readonly currentQuantity: number,
    public readonly minStockLevel: number,
    public readonly timestamp: Date = new Date(),
  ) {}
}

export class StockReservedEvent {
  constructor(
    public readonly inventoryId: string,
    public readonly productId: string,
    public readonly reservedQuantity: number,
    public readonly timestamp: Date = new Date(),
  ) {}
}

export class StockReleasedEvent {
  constructor(
    public readonly inventoryId: string,
    public readonly productId: string,
    public readonly releasedQuantity: number,
    public readonly timestamp: Date = new Date(),
  ) {}
}
