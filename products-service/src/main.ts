import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './infrastructure/filters/global-exception.filter';
import { LOGGER_SERVICE } from './domain/services/logger.service.interface';
import { ILoggerService } from './domain/services/logger.service.interface';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import dataSource from './infrastructure/database/data-source';
import { runDatabaseSeeds } from './infrastructure/database/seed';

async function bootstrap(): Promise<void> {
  const logger: Logger = new Logger('Bootstrap');

  // Initialize database connection
  logger.log('Initializing database connection...');
  const dbConnection: DataSource = await dataSource.initialize();

  // Run migrations
  try {
    logger.log('Running database migrations...');
    const migrations: Array<{ name: string }> = await dbConnection.runMigrations();
    logger.log(`Migrations completed successfully. Applied ${migrations.length} migrations`);
  } catch (error: unknown) {
    const errorMessage: string = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error running migrations:', errorMessage);
    throw error;
  }

  // Run database seeds
  await runDatabaseSeeds(dbConnection);

  // Close the direct database connection as NestJS will manage its own
  await dbConnection.destroy();

  const app: INestApplication = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  const configService: ConfigService = app.get(ConfigService);
  const loggerService: ILoggerService = app.get<ILoggerService>(LOGGER_SERVICE);
  const port: number = configService.get<number>('PORT') || 3001;

  // Global exception filter with logger service
  app.useGlobalFilters(new GlobalExceptionFilter(loggerService));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config: Omit<OpenAPIObject, 'paths'> = new DocumentBuilder()
    .setTitle('Products Service API')
    .setDescription(
      'API documentation for the Products microservice - Manages products, prices, and authentication',
    )
    .setVersion('1.0')
    .addTag('products', 'Product management endpoints')
    .addTag('auth', 'Authentication and authorization')
    .addTag('prices', 'Price management and history')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addServer(`http://localhost:${port}`, 'Local development server')
    .addServer('https://api.production.com', 'Production server')
    .build();

  const document: OpenAPIObject = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Products Service API Docs',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // eslint-disable-next-line @typescript-eslint/typedef
  const httpAdapter = app.getHttpAdapter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  httpAdapter.get('/docs-json', (req: any, res: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    res.json(document);
  });

  await app.listen(port);

  logger.log(`Products Service is running on: http://localhost:${port}/api`);
  logger.log(`Swagger documentation: http://localhost:${port}/docs`);
  logger.log(`Environment: ${configService.get('nodeEnv')}`);
  logger.log(
    `Database: ${configService.get('database.host')}:${configService.get('database.port')}/${configService.get('database.name')}`,
  );
  logger.log(`Redis: ${configService.get('redis.host')}:${configService.get('redis.port')}`);
}

bootstrap();
