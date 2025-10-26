import configuration from '@infrastructure/config/configuration';

describe('Configuration', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return default configuration when no env vars are set', () => {
    process.env = {};

    const config = configuration();

    expect(config.nodeEnv).toBe('development');
    expect(config.port).toBe(3001);
    expect(config.database.host).toBe('localhost');
    expect(config.database.port).toBe(5432);
    expect(config.redis.host).toBe('localhost');
    expect(config.redis.port).toBe(6379);
    expect(config.kafka.brokers).toBe('localhost:9092');
    expect(config.jwt.secret).toBe('change-me-in-production');
    expect(config.jwt.expiration).toBe('24h');
    expect(config.cache.ttl.products).toBe(300);
    expect(config.cache.ttl.exchangeRates).toBe(3600);
  });

  it('should use environment variables when provided', () => {
    process.env = {
      NODE_ENV: 'production',
      PORT: '8080',
      DB_HOST: 'db.example.com',
      DB_PORT: '5433',
      DB_USERNAME: 'prod_user',
      DB_PASSWORD: 'prod_pass',
      DB_NAME: 'prod_db',
      REDIS_HOST: 'redis.example.com',
      REDIS_PORT: '6380',
      KAFKA_BROKERS: 'kafka.example.com:9093',
      JWT_SECRET: 'super-secret-key',
      JWT_EXPIRATION: '1h',
      EXCHANGE_RATE_API_KEY: 'api-key-123',
      EXCHANGE_RATE_API_URL: 'https://api.example.com',
      CACHE_TTL_PRODUCTS: '600',
      CACHE_TTL_EXCHANGE_RATES: '7200',
    };

    const config = configuration();

    expect(config.nodeEnv).toBe('production');
    expect(config.port).toBe(8080);
    expect(config.database.host).toBe('db.example.com');
    expect(config.database.port).toBe(5433);
    expect(config.database.username).toBe('prod_user');
    expect(config.database.password).toBe('prod_pass');
    expect(config.database.name).toBe('prod_db');
    expect(config.redis.host).toBe('redis.example.com');
    expect(config.redis.port).toBe(6380);
    expect(config.kafka.brokers).toBe('kafka.example.com:9093');
    expect(config.jwt.secret).toBe('super-secret-key');
    expect(config.jwt.expiration).toBe('1h');
    expect(config.exchangeRate.apiKey).toBe('api-key-123');
    expect(config.exchangeRate.apiUrl).toBe('https://api.example.com');
    expect(config.cache.ttl.products).toBe(600);
    expect(config.cache.ttl.exchangeRates).toBe(7200);
  });

  it('should parse numeric values correctly', () => {
    process.env = {
      PORT: '4000',
      DB_PORT: '5434',
      REDIS_PORT: '6381',
      KAFKA_SESSION_TIMEOUT: '45000',
      KAFKA_HEARTBEAT_INTERVAL: '5000',
      CACHE_TTL_PRODUCTS: '900',
      MAX_ERROR_LOGS: '2000',
    };

    const config = configuration();

    expect(typeof config.port).toBe('number');
    expect(config.port).toBe(4000);
    expect(typeof config.database.port).toBe('number');
    expect(config.database.port).toBe(5434);
    expect(typeof config.redis.port).toBe('number');
    expect(config.redis.port).toBe(6381);
    expect(typeof config.kafka.sessionTimeout).toBe('number');
    expect(config.kafka.sessionTimeout).toBe(45000);
    expect(typeof config.kafka.heartbeatInterval).toBe('number');
    expect(config.kafka.heartbeatInterval).toBe(5000);
    expect(typeof config.cache.ttl.products).toBe('number');
    expect(config.cache.ttl.products).toBe(900);
    expect(typeof config.logs.maxErrorLogs).toBe('number');
    expect(config.logs.maxErrorLogs).toBe(2000);
  });

  it('should have correct structure for all configuration sections', () => {
    const config = configuration();

    expect(config).toHaveProperty('nodeEnv');
    expect(config).toHaveProperty('port');
    expect(config).toHaveProperty('database');
    expect(config).toHaveProperty('redis');
    expect(config).toHaveProperty('kafka');
    expect(config).toHaveProperty('jwt');
    expect(config).toHaveProperty('exchangeRate');
    expect(config).toHaveProperty('cache');
    expect(config).toHaveProperty('logs');

    expect(config.database).toHaveProperty('host');
    expect(config.database).toHaveProperty('port');
    expect(config.database).toHaveProperty('username');
    expect(config.database).toHaveProperty('password');
    expect(config.database).toHaveProperty('name');

    expect(config.redis).toHaveProperty('host');
    expect(config.redis).toHaveProperty('port');

    expect(config.kafka).toHaveProperty('brokers');
    expect(config.kafka).toHaveProperty('clientId');
    expect(config.kafka).toHaveProperty('groupId');
    expect(config.kafka).toHaveProperty('sessionTimeout');
    expect(config.kafka).toHaveProperty('heartbeatInterval');
    expect(config.kafka).toHaveProperty('initialRetryTime');
    expect(config.kafka).toHaveProperty('maxRetries');
    expect(config.kafka).toHaveProperty('transactionTimeout');

    expect(config.jwt).toHaveProperty('secret');
    expect(config.jwt).toHaveProperty('expiration');

    expect(config.exchangeRate).toHaveProperty('apiKey');
    expect(config.exchangeRate).toHaveProperty('apiUrl');

    expect(config.cache).toHaveProperty('ttl');
    expect(config.cache.ttl).toHaveProperty('products');
    expect(config.cache.ttl).toHaveProperty('exchangeRates');

    expect(config.logs).toHaveProperty('dir');
    expect(config.logs).toHaveProperty('maxErrorLogs');
  });
});
