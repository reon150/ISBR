import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { EventEmitterModule } from '@nestjs/event-emitter';
import request from 'supertest';
import { DataSource } from 'typeorm';

// Test-specific entities with varchar instead of enum for SQLite compatibility
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('test_users')
export class TestUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ type: 'varchar', default: 'user' }) // Use varchar instead of enum
  roles: string;

  @Column({ default: true })
  isActive: boolean;

  @Column()
  createdBy: string;

  @Column()
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  deletedAt?: Date;

  @Column({ nullable: true })
  deletedBy?: string;
}

@Entity('test_categories')
export class TestCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column()
  createdBy: string;

  @Column()
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  deletedAt?: Date;

  @Column({ nullable: true })
  deletedBy?: string;
}

@Entity('test_products')
export class TestProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  sku: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'varchar', default: 'USD' }) // Use varchar instead of enum
  currency: string;

  @Column()
  categoryId: string;

  @Column({ default: 0 })
  stockQuantity: number;

  @Column({ nullable: true })
  minStockLevel?: number;

  @Column({ nullable: true })
  maxStockLevel?: number;

  @Column({ default: true })
  isActive: boolean;

  @Column()
  createdBy: string;

  @Column()
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  deletedAt?: Date;

  @Column({ nullable: true })
  deletedBy?: string;
}

@Entity('test_price_history')
export class TestPriceHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  oldPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  newPrice: number;

  @Column({ type: 'varchar', default: 'USD' }) // Use varchar instead of enum
  currency: string;

  @Column({ nullable: true })
  reason?: string;

  @Column()
  changedBy: string;

  @CreateDateColumn()
  createdAt: Date;
}

export interface TestContext {
  app: INestApplication;
  dataSource: DataSource;
  jwtToken: string;
  request: () => request.SuperTest<request.Test>;
}

export async function setupIntegrationTest(): Promise<TestContext> {
  // Create testing module with better-sqlite3 and test entities
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env.test',
      }),
      TypeOrmModule.forRoot({
        type: 'better-sqlite3',
        database: ':memory:',
        entities: [TestUser, TestCategory, TestProduct, TestPriceHistory],
        synchronize: true,
        logging: false,
      }),
      CacheModule.register({
        store: 'memory',
        ttl: 300,
      }),
      PassportModule,
      JwtModule.register({
        secret: process.env.TEST_JWT_SECRET || 'test-secret',
        signOptions: { expiresIn: '1h' },
      }),
      EventEmitterModule.forRoot(),
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();
  await app.init();

  // Get the data source for database operations
  const dataSource = app.get(DataSource);

  // Generate a test JWT token
  const jwtService = app.get(JwtService);
  const jwtToken = jwtService.sign({
    sub: 'test-user-id',
    email: 'test@example.com',
    roles: ['admin'],
  });

  return {
    app,
    dataSource,
    jwtToken,
    request: () => request(app.getHttpServer()),
  };
}

export async function tearDownIntegrationTest(context: TestContext): Promise<void> {
  if (context && context.app) {
    await context.app.close();
  }
}
