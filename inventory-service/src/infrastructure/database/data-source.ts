import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { Inventory } from '../../domain/entities/inventory.entity';
import { InventoryMovement } from '../../domain/entities/inventory-movement.entity';
import { ProcessedEvent } from '../../domain/entities/processed-event.entity';

// Load environment variables
config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'inventory_db',
  entities: [Inventory, InventoryMovement, ProcessedEvent],
  migrations:
    process.env.NODE_ENV === 'production'
      ? ['dist/infrastructure/database/migrations/*.js']
      : ['src/infrastructure/database/migrations/*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  migrationsRun: false,
};

const dataSource: DataSource = new DataSource(dataSourceOptions);

export default dataSource;
