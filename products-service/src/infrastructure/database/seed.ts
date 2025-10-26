import { Logger } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Product } from '../../domain/entities/product.entity';
import { seedInitialData } from './seeds/initial-data.seed';

export async function runDatabaseSeeds(dataSource: DataSource): Promise<void> {
  const logger: Logger = new Logger('DatabaseSeeds');

  try {
    const productRepo: Repository<Product> = dataSource.getRepository(Product);
    const productCount: number = await productRepo.count();

    if (productCount === 0) {
      await seedInitialData(dataSource);
    } else {
      logger.log(`Found ${productCount} existing products, skipping seeding`);
    }
  } catch (error: unknown) {
    const errorMessage: string = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error running database seeds:', errorMessage);
    throw error;
  }
}

// For CLI usage
async function runFromCLI(): Promise<void> {
  const logger: Logger = new Logger('DatabaseSeeds');
  const dataSource: DataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'products_db',
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
