import { Logger } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Inventory } from '../../domain/entities/inventory.entity';
import { seedInitialData } from './seeds/initial-data.seed';

export async function runDatabaseSeeds(dataSource: DataSource): Promise<void> {
  const logger: Logger = new Logger('DatabaseSeeds');

  try {
    const inventoryRepo: Repository<Inventory> = dataSource.getRepository(Inventory);
    const inventoryCount: number = await inventoryRepo.count();

    if (inventoryCount === 0) {
      logger.log('No inventory records found, running initial seeds...');
      await seedInitialData(dataSource);
      logger.log('Initial seeding completed successfully');
    } else {
      logger.log(`Found ${inventoryCount} existing inventory records, skipping seeding`);
    }
  } catch (error: unknown) {
    const errorMessage: string = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error running database seeds:', errorMessage);
    throw error;
  }
}

async function runFromCLI(): Promise<void> {
  const logger: Logger = new Logger('DatabaseSeeds');
  const dataSource: DataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'inventory_db',
  });

  try {
    const connection: DataSource = await dataSource.initialize();
    await runDatabaseSeeds(connection);
  } catch (error: unknown) {
    const errorMessage: string = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error in CLI seed execution:', errorMessage);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

if (require.main === module) {
  runFromCLI();
}
