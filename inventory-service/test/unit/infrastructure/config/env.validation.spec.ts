import { EnvironmentVariables, Environment } from '@infrastructure/config/env.validation';
import { plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';

describe('EnvironmentVariables', () => {
  it('should validate valid environment variables', () => {
    const validEnv = {
      NODE_ENV: 'development',
      PORT: '3002',
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_USERNAME: 'user',
      DB_PASSWORD: 'password',
      DB_NAME: 'testdb',
      JWT_SECRET: 'secret',
      JWT_EXPIRES_IN: '1h',
      JWT_EXPIRATION: '24h',
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',
      KAFKA_BROKERS: 'localhost:9092',
      KAFKA_CLIENT_ID: 'test-client',
      KAFKA_GROUP_ID: 'test-group',
      KAFKA_SESSION_TIMEOUT: '30000',
      KAFKA_HEARTBEAT_INTERVAL: '3000',
      KAFKA_INITIAL_RETRY_TIME: '300',
      KAFKA_MAX_RETRIES: '10',
      KAFKA_TRANSACTION_TIMEOUT: '30000',
      CACHE_TTL_INVENTORY: '300',
      LOGS_DIR: './logs',
      MAX_ERROR_LOGS: '1000',
      EVENT_RETENTION_DAYS: '30',
      EVENT_CLEANUP_CRON: '0 2 * * *',
    };

    const env = plainToClass(EnvironmentVariables, validEnv);
    const errors = validateSync(env);

    expect(errors).toHaveLength(0);
  });

  it('should fail validation for invalid NODE_ENV', () => {
    const invalidEnv = {
      NODE_ENV: 'invalid',
      PORT: '3002',
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_USERNAME: 'user',
      DB_PASSWORD: 'password',
      DB_NAME: 'testdb',
      JWT_SECRET: 'secret',
      JWT_EXPIRES_IN: '1h',
      JWT_EXPIRATION: '24h',
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',
      KAFKA_BROKERS: 'localhost:9092',
      KAFKA_CLIENT_ID: 'test-client',
      KAFKA_GROUP_ID: 'test-group',
      KAFKA_SESSION_TIMEOUT: '30000',
      KAFKA_HEARTBEAT_INTERVAL: '3000',
      KAFKA_INITIAL_RETRY_TIME: '300',
      KAFKA_MAX_RETRIES: '10',
      KAFKA_TRANSACTION_TIMEOUT: '30000',
      CACHE_TTL_INVENTORY: '300',
      LOGS_DIR: './logs',
      MAX_ERROR_LOGS: '1000',
      EVENT_RETENTION_DAYS: '30',
      EVENT_CLEANUP_CRON: '0 2 * * *',
    };

    const env = plainToClass(EnvironmentVariables, invalidEnv);
    const errors = validateSync(env);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('NODE_ENV');
  });

  it('should fail validation for invalid PORT', () => {
    const invalidEnv = {
      NODE_ENV: 'development',
      PORT: '70000', // Invalid port
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_USERNAME: 'user',
      DB_PASSWORD: 'password',
      DB_NAME: 'testdb',
      JWT_SECRET: 'secret',
      JWT_EXPIRES_IN: '1h',
      JWT_EXPIRATION: '24h',
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',
      KAFKA_BROKERS: 'localhost:9092',
      KAFKA_CLIENT_ID: 'test-client',
      KAFKA_GROUP_ID: 'test-group',
      KAFKA_SESSION_TIMEOUT: '30000',
      KAFKA_HEARTBEAT_INTERVAL: '3000',
      KAFKA_INITIAL_RETRY_TIME: '300',
      KAFKA_MAX_RETRIES: '10',
      KAFKA_TRANSACTION_TIMEOUT: '30000',
      CACHE_TTL_INVENTORY: '300',
      LOGS_DIR: './logs',
      MAX_ERROR_LOGS: '1000',
      EVENT_RETENTION_DAYS: '30',
      EVENT_CLEANUP_CRON: '0 2 * * *',
    };

    const env = plainToClass(EnvironmentVariables, invalidEnv);
    const errors = validateSync(env);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('PORT');
  });

  it('should fail validation for missing required fields', () => {
    const invalidEnv = {
      NODE_ENV: 'development',
      // Missing PORT
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_USERNAME: 'user',
      DB_PASSWORD: 'password',
      DB_NAME: 'testdb',
      JWT_SECRET: 'secret',
      JWT_EXPIRES_IN: '1h',
      JWT_EXPIRATION: '24h',
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',
      KAFKA_BROKERS: 'localhost:9092',
      KAFKA_CLIENT_ID: 'test-client',
      KAFKA_GROUP_ID: 'test-group',
      KAFKA_SESSION_TIMEOUT: '30000',
      KAFKA_HEARTBEAT_INTERVAL: '3000',
      KAFKA_INITIAL_RETRY_TIME: '300',
      KAFKA_MAX_RETRIES: '10',
      KAFKA_TRANSACTION_TIMEOUT: '30000',
      CACHE_TTL_INVENTORY: '300',
      LOGS_DIR: './logs',
      MAX_ERROR_LOGS: '1000',
      EVENT_RETENTION_DAYS: '30',
      EVENT_CLEANUP_CRON: '0 2 * * *',
    };

    const env = plainToClass(EnvironmentVariables, invalidEnv);
    const errors = validateSync(env);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((error) => error.property === 'PORT')).toBe(true);
  });

  it('should transform string PORT to number', () => {
    const envData = {
      NODE_ENV: 'development',
      PORT: '3002',
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_USERNAME: 'user',
      DB_PASSWORD: 'password',
      DB_NAME: 'testdb',
      JWT_SECRET: 'secret',
      JWT_EXPIRES_IN: '1h',
      JWT_EXPIRATION: '24h',
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',
      KAFKA_BROKERS: 'localhost:9092',
      KAFKA_CLIENT_ID: 'test-client',
      KAFKA_GROUP_ID: 'test-group',
      KAFKA_SESSION_TIMEOUT: '30000',
      KAFKA_HEARTBEAT_INTERVAL: '3000',
      KAFKA_INITIAL_RETRY_TIME: '300',
      KAFKA_MAX_RETRIES: '10',
      KAFKA_TRANSACTION_TIMEOUT: '30000',
      CACHE_TTL_INVENTORY: '300',
      LOGS_DIR: './logs',
      MAX_ERROR_LOGS: '1000',
      EVENT_RETENTION_DAYS: '30',
      EVENT_CLEANUP_CRON: '0 2 * * *',
    };

    const env = plainToClass(EnvironmentVariables, envData);

    expect(typeof env.PORT).toBe('number');
    expect(env.PORT).toBe(3002);
  });

  it('should validate JWT_EXPIRATION format', () => {
    const invalidEnv = {
      NODE_ENV: 'development',
      PORT: '3002',
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_USERNAME: 'user',
      DB_PASSWORD: 'password',
      DB_NAME: 'testdb',
      JWT_SECRET: 'secret',
      JWT_EXPIRES_IN: '1h',
      JWT_EXPIRATION: '',
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',
      KAFKA_BROKERS: 'localhost:9092',
      KAFKA_CLIENT_ID: 'test-client',
      KAFKA_GROUP_ID: 'test-group',
      KAFKA_SESSION_TIMEOUT: '30000',
      KAFKA_HEARTBEAT_INTERVAL: '3000',
      KAFKA_INITIAL_RETRY_TIME: '300',
      KAFKA_MAX_RETRIES: '10',
      KAFKA_TRANSACTION_TIMEOUT: '30000',
      CACHE_TTL_INVENTORY: '300',
      LOGS_DIR: './logs',
      MAX_ERROR_LOGS: '1000',
      EVENT_RETENTION_DAYS: '30',
      EVENT_CLEANUP_CRON: '0 2 * * *',
    };

    const env = plainToClass(EnvironmentVariables, invalidEnv);
    const errors = validateSync(env);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((error) => error.property === 'JWT_EXPIRATION')).toBe(true);
  });
});
