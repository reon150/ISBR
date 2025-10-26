import { Module, MiddlewareConsumer, NestModule, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisStore } from './infrastructure/cache/redis.store';

import { configuration, validate, getConfig, AppConfiguration } from './infrastructure/config';

import { Product } from './domain/entities/product.entity';
import { PriceHistory } from './domain/entities/price-history.entity';
import { User } from './domain/entities/user.entity';
import { Category } from './domain/entities/category.entity';
import { ProcessedEvent } from './domain/entities/processed-event.entity';

import { ProductRepository } from './infrastructure/database/repositories/product.repository';
import { CachedProductRepository } from './infrastructure/database/repositories/cached-product.repository';
import { PriceHistoryRepository } from './infrastructure/database/repositories/price-history.repository';
import { UserRepository } from './infrastructure/database/repositories/user.repository';
import { CategoryRepository } from './infrastructure/database/repositories/category.repository';
import { ProcessedEventRepository } from './infrastructure/database/repositories/processed-event.repository';
import {
  PRODUCT_REPOSITORY,
  IProductRepository,
} from './domain/repositories/product.repository.interface';
import { PRICE_HISTORY_REPOSITORY } from './domain/repositories/price-history.repository.interface';
import { USER_REPOSITORY } from './domain/repositories/user.repository.interface';
import { CATEGORY_REPOSITORY } from './domain/repositories/category.repository.interface';
import { PROCESSED_EVENT_REPOSITORY } from './domain/repositories/processed-event.repository.interface';

import {
  CreateProductUseCase,
  GetAllProductsUseCase,
  GetProductByIdUseCase,
  UpdateProductUseCase,
  DeleteProductUseCase,
} from './application/use-cases/product';
import { GetPriceHistoryUseCase } from './application/use-cases/price';
import { GetAllCategoriesUseCase } from './application/use-cases/category';

import { AuthService } from './application/services/auth';
import { PriceConversionService } from './application/services/price-conversion.service';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CacheService } from './infrastructure/cache/cache.service';
import { ICacheService, CACHE_SERVICE } from './domain/services/cache.service.interface';
import { EXCHANGE_RATE_SERVICE } from './domain/services/exchange-rate.service.interface';
import { PRICE_CONVERSION_SERVICE } from './domain/services/price-conversion.service.interface';
import { LOGGER_SERVICE } from './domain/services/logger.service.interface';
import { LoggerService } from './infrastructure/logger/logger.service';
import { ContextualLoggerService } from './infrastructure/logger/contextual-logger.service';
import { ExchangeRateService } from './infrastructure/external/exchange-rate/exchange-rate.service';
import { KafkaService } from './infrastructure/messaging/kafka.service';
import { ProductEventPublisher } from './infrastructure/messaging/product-event-publisher.service';
import { InventoryEventConsumer } from './infrastructure/messaging/inventory-event-consumer.service';
import {
  IdempotencyService,
  IDEMPOTENCY_SERVICE,
} from './infrastructure/messaging/idempotency.service';
import { EventCleanupScheduler } from './infrastructure/schedulers/event-cleanup.scheduler';

import { JwtStrategy } from './infrastructure/auth/strategies/jwt.strategy';
import { LocalStrategy } from './infrastructure/auth/strategies/local.strategy';
import { ExecutionContextService } from './infrastructure/auth/execution-context.service';
import { EXECUTION_CONTEXT } from './domain/shared/interfaces/execution-context.interface';

import { AuthController } from './presentation/controllers/auth.controller';
import { ProductsController } from './presentation/controllers/products.controller';
import { CategoriesController } from './presentation/controllers/categories.controller';

import { RequestIdMiddleware } from './infrastructure/middleware/request-id.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
      validate,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const config: AppConfiguration = getConfig(configService);
        return {
          type: 'postgres',
          host: config.database.host,
          port: config.database.port,
          username: config.database.username,
          password: config.database.password,
          database: config.database.name,
          entities: [Product, PriceHistory, User, Category, ProcessedEvent],
          migrations: ['dist/infrastructure/database/migrations/*.js'],
          migrationsRun: config.nodeEnv === 'production',
          synchronize: false,
          logging: config.nodeEnv === 'development',
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Product, PriceHistory, User, Category, ProcessedEvent]),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const config: AppConfiguration = getConfig(configService);
        return {
          store: new RedisStore({
            host: config.redis.host,
            port: config.redis.port,
            connectTimeout: 30000,
            retryDelayOnFailover: 2000,
            maxAttempts: 10,
          }),
          ttl: config.cache.ttl.products,
        };
      },
      inject: [ConfigService],
      isGlobal: true,
    }),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const config: AppConfiguration = getConfig(configService);
        return {
          secret: config.jwt.secret,
          signOptions: {
            expiresIn: config.jwt.expiration,
          },
        };
      },
      inject: [ConfigService],
    }),
    EventEmitterModule.forRoot(),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    ScheduleModule.forRoot() as any,
  ],
  controllers: [AuthController, ProductsController, CategoriesController],
  providers: [
    ProductRepository,
    {
      provide: PRODUCT_REPOSITORY,
      useFactory: (
        productRepo: ProductRepository,
        cacheService: ICacheService,
        configService: ConfigService,
      ) => {
        return new CachedProductRepository(productRepo, cacheService, configService);
      },
      inject: [ProductRepository, CACHE_SERVICE, ConfigService],
    },
    {
      provide: PRICE_HISTORY_REPOSITORY,
      useClass: PriceHistoryRepository,
    },
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
    {
      provide: CATEGORY_REPOSITORY,
      useClass: CategoryRepository,
    },
    {
      provide: PROCESSED_EVENT_REPOSITORY,
      useClass: ProcessedEventRepository,
    },
    {
      provide: LOGGER_SERVICE,
      useClass: LoggerService,
    },
    Logger,
    CreateProductUseCase,
    GetAllProductsUseCase,
    GetProductByIdUseCase,
    UpdateProductUseCase,
    DeleteProductUseCase,
    GetPriceHistoryUseCase,
    GetAllCategoriesUseCase,
    AuthService,
    {
      provide: CACHE_SERVICE,
      useFactory: (cacheManager: Cache, logger: LoggerService, configService: ConfigService) => {
        return new CacheService(cacheManager, configService, logger);
      },
      inject: [CACHE_MANAGER, LOGGER_SERVICE, ConfigService],
    },
    {
      provide: EXCHANGE_RATE_SERVICE,
      useFactory: (
        configService: ConfigService,
        cacheService: ICacheService,
        logger: LoggerService,
      ) => {
        const contextualLogger: ContextualLoggerService = new ContextualLoggerService(
          logger,
          'ExchangeRateService',
        );
        return new ExchangeRateService(configService, cacheService, contextualLogger);
      },
      inject: [ConfigService, CACHE_SERVICE, LOGGER_SERVICE],
    },
    {
      provide: PRICE_CONVERSION_SERVICE,
      useClass: PriceConversionService,
    },
    KafkaService,
    {
      provide: ProductEventPublisher,
      useFactory: (kafkaService: KafkaService, logger: LoggerService) => {
        const contextualLogger: ContextualLoggerService = new ContextualLoggerService(
          logger,
          ProductEventPublisher.name,
        );
        return new ProductEventPublisher(kafkaService, contextualLogger);
      },
      inject: [KafkaService, LOGGER_SERVICE],
    },
    {
      provide: InventoryEventConsumer,
      useFactory: (
        kafkaService: KafkaService,
        productRepository: IProductRepository,
        logger: LoggerService,
      ) => {
        const contextualLogger: ContextualLoggerService = new ContextualLoggerService(
          logger,
          InventoryEventConsumer.name,
        );
        return new InventoryEventConsumer(kafkaService, productRepository, contextualLogger);
      },
      inject: [KafkaService, PRODUCT_REPOSITORY, LOGGER_SERVICE],
    },
    {
      provide: IDEMPOTENCY_SERVICE,
      useClass: IdempotencyService,
    },
    EventCleanupScheduler,
    {
      provide: EXECUTION_CONTEXT,
      useClass: ExecutionContextService,
    },
    JwtStrategy,
    LocalStrategy,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
