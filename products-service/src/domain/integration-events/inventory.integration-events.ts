export interface InventoryAdjustedEvent extends Record<string, unknown> {
  inventoryId: string;
  productId: string;
  oldQuantity: number;
  newQuantity: number;
  movementType: string;
  createdBy: string;
  timestamp: Date;
}
