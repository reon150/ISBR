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
import { Inventory } from './domain/entities/inventory.entity';
import { InventoryMovement } from './domain/entities/inventory-movement.entity';
import { ProcessedEvent } from './domain/entities/processed-event.entity';
import { InventoryRepository } from './infrastructure/database/repositories/inventory.repository';
import { CachedInventoryRepository } from './infrastructure/database/repositories/cached-inventory.repository';
import { InventoryMovementRepository } from './infrastructure/database/repositories/inventory-movement.repository';
import { ProcessedEventRepository } from './infrastructure/database/repositories/processed-event.repository';
import {
  INVENTORY_REPOSITORY,
  IInventoryRepository,
} from './domain/repositories/inventory.repository.interface';
import { INVENTORY_MOVEMENT_REPOSITORY } from './domain/repositories/inventory-movement.repository.interface';
import { PROCESSED_EVENT_REPOSITORY } from './domain/repositories/processed-event.repository.interface';
import {
  AdjustInventoryUseCase,
  GetInventoryByProductIdUseCase,
} from './application/use-cases/inventory';
import { GetMovementHistoryUseCase } from './application/use-cases/movement';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CacheService } from './infrastructure/cache/cache.service';
import { ICacheService, CACHE_SERVICE } from './domain/services/cache.service.interface';
import { LOGGER_SERVICE } from './domain/services/logger.service.interface';
import { LoggerService } from './infrastructure/logger/logger.service';
import { ContextualLoggerService } from './infrastructure/logger/contextual-logger.service';
import { KafkaService } from './infrastructure/messaging/kafka.service';
import { InventoryEventPublisher } from './infrastructure/messaging/inventory-event-publisher.service';
import {
  ProductEventConsumer,
  IDEMPOTENCY_SERVICE,
} from './infrastructure/messaging/product-event-consumer.service';
import { IdempotencyService } from './infrastructure/messaging/idempotency.service';
import { IIdempotencyService } from './domain/services/idempotency.service.interface';
import { EventCleanupScheduler } from './infrastructure/schedulers/event-cleanup.scheduler';
import { JwtStrategy } from './infrastructure/auth/strategies/jwt.strategy';
import { ExecutionContextService } from './infrastructure/auth/execution-context.service';
import { EXECUTION_CONTEXT } from './domain/shared/interfaces/execution-context.interface';
import { InventoryController } from './presentation/controllers/inventory.controller';
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
          entities: [Inventory, InventoryMovement, ProcessedEvent],
          migrations: ['dist/infrastructure/database/migrations/*.js'],
          migrationsRun: config.nodeEnv === 'production',
          synchronize: false,
          logging: config.nodeEnv === 'development',
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Inventory, InventoryMovement, ProcessedEvent]),
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
          ttl: config.cache.ttl.inventory,
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
    ScheduleModule.forRoot(),
  ],
  controllers: [InventoryController],
  providers: [
    InventoryRepository,
    {
      provide: INVENTORY_REPOSITORY,
      useFactory: (
        inventoryRepo: InventoryRepository,
        cacheService: ICacheService,
        configService: ConfigService,
      ) => {
        return new CachedInventoryRepository(inventoryRepo, cacheService, configService);
      },
      inject: [InventoryRepository, CACHE_SERVICE, ConfigService],
    },
    {
      provide: INVENTORY_MOVEMENT_REPOSITORY,
      useClass: InventoryMovementRepository,
    },
    {
      provide: PROCESSED_EVENT_REPOSITORY,
      useClass: ProcessedEventRepository,
    },
    {
      provide: CACHE_SERVICE,
      useFactory: (cacheManager: Cache, configService: ConfigService, logger: LoggerService) => {
        return new CacheService(cacheManager, configService, logger);
      },
      inject: [CACHE_MANAGER, ConfigService, LOGGER_SERVICE],
    },
    {
      provide: LOGGER_SERVICE,
      useClass: LoggerService,
    },
    Logger,
    AdjustInventoryUseCase,
    GetInventoryByProductIdUseCase,
    GetMovementHistoryUseCase,
    KafkaService,
    {
      provide: InventoryEventPublisher,
      useFactory: (kafkaService: KafkaService, logger: LoggerService) => {
        const contextualLogger: ContextualLoggerService = new ContextualLoggerService(
          logger,
          InventoryEventPublisher.name,
        );
        return new InventoryEventPublisher(kafkaService, contextualLogger);
      },
      inject: [KafkaService, LOGGER_SERVICE],
    },
    {
      provide: IDEMPOTENCY_SERVICE,
      useClass: IdempotencyService,
    },
    {
      provide: ProductEventConsumer,
      useFactory: (
        kafkaService: KafkaService,
        inventoryRepository: IInventoryRepository,
        cacheService: ICacheService,
        idempotencyService: IIdempotencyService,
        logger: LoggerService,
      ) => {
        const contextualLogger: ContextualLoggerService = new ContextualLoggerService(
          logger,
          ProductEventConsumer.name,
        );
        return new ProductEventConsumer(
          kafkaService,
          inventoryRepository,
          cacheService,
          idempotencyService,
          contextualLogger,
        );
      },
      inject: [
        KafkaService,
        INVENTORY_REPOSITORY,
        CACHE_SERVICE,
        IDEMPOTENCY_SERVICE,
        LOGGER_SERVICE,
      ],
    },
    EventCleanupScheduler,
    {
      provide: EXECUTION_CONTEXT,
      useClass: ExecutionContextService,
    },
    JwtStrategy,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
