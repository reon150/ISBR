import { Inventory } from '@domain/entities/inventory.entity';
import { InventoryMovement } from '@domain/entities/inventory-movement.entity';
import { MovementType } from '@domain/shared/enums';

const createMockInventory: () => Inventory = (): Inventory => {
  const mockInventory = {
    id: '1',
    productId: 'product-1',
    quantity: 50,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-1',
    updatedBy: 'user-1',
    deletedAt: new Date(),
    deletedBy: '',
    movements: [],
  };

  Object.assign(mockInventory, {
    adjustQuantity: jest.fn(),
    delete: jest.fn(),
    isDeleted: jest.fn().mockReturnValue(false),
  });

  return mockInventory as unknown as Inventory;
};

export const mockInventory: Inventory = createMockInventory();

export const mockInventoryMovement: InventoryMovement = {
  id: '1',
  inventoryId: '1',
  inventory: createMockInventory(),
  type: 'IN' as MovementType,
  quantity: 10,
  quantityBefore: 50,
  quantityAfter: 60,
  reason: 'Test adjustment',
  reference: 'REF-001',
  createdAt: new Date(),
  createdBy: 'user-1',
  metadata: {},
};

export const mockProcessedEvent: {
  id: string;
  eventId: string;
  eventType: string;
  eventData: { productId: string; quantity: number };
  createdAt: Date;
  createdBy: string;
  processingResult: string;
  errorMessage: null;
} = {
  id: '1',
  eventId: 'event-1',
  eventType: 'ProductCreated',
  eventData: { productId: 'product-1', quantity: 10 },
  createdAt: new Date(),
  createdBy: 'user-1',
  processingResult: 'success',
  errorMessage: null,
};
