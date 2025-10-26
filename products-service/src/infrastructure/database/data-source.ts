import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { Product } from '../../domain/entities/product.entity';
import { PriceHistory } from '../../domain/entities/price-history.entity';
import { User } from '../../domain/entities/user.entity';
import { Category } from '../../domain/entities/category.entity';

// Load environment variables
config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'products_db',
  entities: [Product, PriceHistory, User, Category],
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
