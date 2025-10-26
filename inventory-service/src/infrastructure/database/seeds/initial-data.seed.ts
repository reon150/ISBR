import { DataSource, Repository } from 'typeorm';
import { Inventory } from '../../../domain/entities/inventory.entity';
import { InventoryMovement } from '../../../domain/entities/inventory-movement.entity';
import { MovementType } from '../../../domain/shared/constants';

interface ProductInfo {
  id: string;
  sku: string;
  name: string;
}

const FIXED_PRODUCT_IDS: Record<string, string> = {
  'LAPTOP-001': 'a7b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d',
  'MOUSE-001': 'b8c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e',
  'KEYBOARD-001': 'c9d5e6f7-a8b9-4c0d-1e2f-3a4b5c6d7e8',
  'MONITOR-001': 'd0e6f7a8-b9c0-4d1e-2f3a-4b5c6d7e8f9',
  'DESK-001': 'e1f7a8b9-c0d1-4e2f-3a4b-5c6d7e8f9a0',
  'CHAIR-001': 'f2a8b9c0-d1e2-4f3a-4b5c-6d7e8f9a0b1',
  'HEADSET-001': 'a3b9c0d1-e2f3-4a4b-5c6d-7e8f9a0b1c2',
  'WEBCAM-001': 'b4c0d1e2-f3a4-4b5c-6d7e-8f9a0b1c2d3',
  'PRINTER-001': 'c5d1e2f3-a4b5-4c6d-7e8f-9a0b1c2d3e4',
  'TABLET-001': 'd6e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5',
};

export async function seedInitialData(dataSource: DataSource): Promise<void> {
  const inventoryRepository: Repository<Inventory> = dataSource.getRepository(Inventory);
  const movementRepository: Repository<InventoryMovement> =
    dataSource.getRepository(InventoryMovement);

  const existingInventory: number = await inventoryRepository.count();
  if (existingInventory > 0) {
    return;
  }

  const products: ProductInfo[] = Object.entries(FIXED_PRODUCT_IDS).map(([sku, id]) => ({
    id,
    sku,
    name: getProductName(sku),
  }));

  for (const product of products) {
    const quantity: number = Math.floor(Math.random() * 140) + 10;

    const inventory: Inventory = new Inventory();
    inventory.productId = product.id;
    inventory.quantity = quantity;
    inventory.createdBy = 'system';
    inventory.updatedBy = 'system';

    await inventoryRepository.save(inventory);

    const timestamp: string = Date.now().toString();
    const refSuffix: string = Math.random().toString(36).substring(2, 8).toUpperCase();

    const movement: InventoryMovement = new InventoryMovement();
    movement.inventoryId = inventory.id;
    movement.type = MovementType.IN;
    movement.quantity = quantity;
    movement.quantityBefore = 0;
    movement.quantityAfter = quantity;
    movement.reason = 'INITIAL_STOCK';
    movement.reference = `INIT-${timestamp}-${refSuffix}`;
    movement.createdBy = 'system';
    movement.metadata = { source: 'seed', productSku: product.sku };

    await movementRepository.save(movement);

    if (Math.random() > 0.3) {
      const additionalCount: number = Math.floor(Math.random() * 3) + 1;
      for (let i: number = 0; i < additionalCount; i++) {
        const mvType: MovementType = Math.random() > 0.5 ? MovementType.IN : MovementType.OUT;
        const mvQuantity: number = Math.floor(Math.random() * Math.floor(quantity * 0.3)) + 1;

        let newQty: number = inventory.quantity;
        if (mvType === MovementType.IN) {
          newQty += mvQuantity;
        } else if (mvType === MovementType.OUT && inventory.quantity >= mvQuantity) {
          newQty -= mvQuantity;
        }

        const reasons: string[] = ['SALES', 'ADJUSTMENT', 'TRANSFER', 'RETURN'];
        const mv: InventoryMovement = new InventoryMovement();
        mv.inventoryId = inventory.id;
        mv.type = mvType;
        mv.quantity = mvQuantity;
        mv.quantityBefore = inventory.quantity;
        mv.quantityAfter = newQty;
        mv.reason = reasons[Math.floor(Math.random() * reasons.length)];
        mv.reference = Math.random().toString(36).substring(2, 10).toUpperCase();
        mv.createdBy = 'system';
        mv.metadata = {
          source: 'seed',
          productSku: product.sku,
          timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        };

        await movementRepository.save(mv);
        inventory.quantity = newQty;
        await inventoryRepository.save(inventory);
      }
    }
  }
}

function getProductName(sku: string): string {
  const names: Record<string, string> = {
    'LAPTOP-001': 'Laptop Dell Latitude 5420',
    'MOUSE-001': 'Mouse Logitech MX Master 3',
    'KEYBOARD-001': 'Teclado Mecánico Keychron K8',
    'MONITOR-001': 'Monitor LG UltraWide 34"',
    'DESK-001': 'Escritorio Standing Desk Eléctrico',
    'CHAIR-001': 'Silla Ergonómica Herman Miller Aeron',
    'HEADSET-001': 'Audífonos Sony WH-1000XM5',
    'WEBCAM-001': 'Cámara Web Logitech Brio 4K',
    'PRINTER-001': 'Impresora HP LaserJet Pro M404dn',
    'TABLET-001': 'Tablet iPad Air 5ta Gen',
  };
  return names[sku] || 'Unknown Product';
}
