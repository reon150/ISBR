import {
  IsString,
  IsNumber,
  IsEnum,
  IsNotEmpty,
  Min,
  Max,
  validateSync,
  ValidationError,
} from 'class-validator';
import { plainToClass, Transform } from 'class-transformer';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  // Application
  @IsEnum(Environment)
  @IsNotEmpty()
  NODE_ENV: Environment;

  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  @Max(65535)
  PORT: number;

  // Database
  @IsString()
  @IsNotEmpty()
  DB_HOST: string;

  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  @Max(65535)
  DB_PORT: number;

  @IsString()
  @IsNotEmpty()
  DB_USERNAME: string;

  @IsString()
  @IsNotEmpty()
  DB_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  DB_NAME: string;

  // Redis
  @IsString()
  @IsNotEmpty()
  REDIS_HOST: string;

  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  @Max(65535)
  REDIS_PORT: number;

  // Kafka
  @IsString()
  @IsNotEmpty()
  KAFKA_BROKERS: string;

  @IsString()
  @IsNotEmpty()
  KAFKA_CLIENT_ID: string;

  @IsString()
  @IsNotEmpty()
  KAFKA_GROUP_ID: string;

  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsNumber()
  @Min(1000)
  KAFKA_SESSION_TIMEOUT: number;

  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsNumber()
  @Min(100)
  KAFKA_HEARTBEAT_INTERVAL: number;

  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsNumber()
  @Min(100)
  KAFKA_INITIAL_RETRY_TIME: number;

  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  KAFKA_MAX_RETRIES: number;

  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsNumber()
  @Min(1000)
  KAFKA_TRANSACTION_TIMEOUT: number;

  // JWT
  @IsString()
  @IsNotEmpty()
  JWT_SECRET: string;

  @IsString()
  @IsNotEmpty()
  JWT_EXPIRATION: string;

  // Cache TTL
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsNumber()
  @Min(0)
  CACHE_TTL_INVENTORY: number;

  // Event Cleanup
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  EVENT_RETENTION_DAYS: number;

  @IsString()
  @IsNotEmpty()
  EVENT_CLEANUP_CRON: string;

  // Logs
  @IsString()
  @IsNotEmpty()
  LOGS_DIR: string;

  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  MAX_ERROR_LOGS: number;
}

export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig: EnvironmentVariables = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors: ValidationError[] = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const missingVars: string[] = errors.map((error) => {
      const constraints: string = error.constraints
        ? Object.values(error.constraints).join(', ')
        : 'Unknown error';
      return `  - ${error.property}: ${constraints}`;
    });

    throw new Error(
      `❌ Configuration validation failed:\n\n${missingVars.join('\n')}\n\n` +
        `Please check your .env file and ensure all required environment variables are set correctly.\n` +
        `See .env.example for reference.`,
    );
  }

  return validatedConfig;
}
