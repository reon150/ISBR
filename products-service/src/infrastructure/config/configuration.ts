export interface AppConfiguration {
  nodeEnv: string;
  port: number;
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    name: string;
  };
  redis: {
    host: string;
    port: number;
  };
  kafka: {
    brokers: string;
    clientId: string;
    groupId: string;
    sessionTimeout: number;
    heartbeatInterval: number;
    initialRetryTime: number;
    maxRetries: number;
    transactionTimeout: number;
  };
  jwt: {
    secret: string;
    expiration: string;
  };
  exchangeRate: {
    apiKey: string;
    apiUrl: string;
  };
  cache: {
    ttl: {
      products: number;
      exchangeRates: number;
    };
  };
  logs: {
    dir: string;
    maxErrorLogs: number;
  };
  scheduler: {
    eventRetentionDays: number;
    eventCleanupCron: string;
  };
}

export default (): AppConfiguration => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    name: process.env.DB_NAME || 'products_db',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },

  kafka: {
    brokers: process.env.KAFKA_BROKERS || 'localhost:9092',
    clientId: process.env.KAFKA_CLIENT_ID || 'products-service',
    groupId: process.env.KAFKA_GROUP_ID || 'products-consumer-group',
    sessionTimeout: parseInt(process.env.KAFKA_SESSION_TIMEOUT || '30000', 10),
    heartbeatInterval: parseInt(process.env.KAFKA_HEARTBEAT_INTERVAL || '3000', 10),
    initialRetryTime: parseInt(process.env.KAFKA_INITIAL_RETRY_TIME || '300', 10),
    maxRetries: parseInt(process.env.KAFKA_MAX_RETRIES || '10', 10),
    transactionTimeout: parseInt(process.env.KAFKA_TRANSACTION_TIMEOUT || '30000', 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-in-production',
    expiration: process.env.JWT_EXPIRATION || '24h',
  },

  exchangeRate: {
    apiKey: process.env.EXCHANGE_RATE_API_KEY || '',
    apiUrl: process.env.EXCHANGE_RATE_API_URL || 'https://v6.exchangerate-api.com/v6',
  },

  cache: {
    ttl: {
      products: parseInt(process.env.CACHE_TTL_PRODUCTS || '300', 10),
      exchangeRates: parseInt(process.env.CACHE_TTL_EXCHANGE_RATES || '3600', 10),
    },
  },

  logs: {
    dir: process.env.LOGS_DIR || './logs',
    maxErrorLogs: parseInt(process.env.MAX_ERROR_LOGS || '1000', 10),
  },

  scheduler: {
    eventRetentionDays: parseInt(process.env.EVENT_RETENTION_DAYS || '30', 10),
    eventCleanupCron: process.env.EVENT_CLEANUP_CRON || '0 2 * * *',
  },
});
