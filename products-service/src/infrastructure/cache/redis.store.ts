import { createClient, RedisClientType } from 'redis';

export class RedisStore {
  private client: RedisClientType | null = null;
  private connected = false;
  private connectionPromise: Promise<void> | null = null;

  constructor(
    private options: {
      host: string;
      port: number;
      connectTimeout?: number;
      retryDelayOnFailover?: number;
      maxAttempts?: number;
    },
  ) {}

  private async ensureConnection(): Promise<void> {
    if (this.connected && this.client) {
      return;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this.connect();
    return this.connectionPromise;
  }

  private async connect(): Promise<void> {
    try {
      this.client = createClient({
        socket: {
          host: this.options.host,
          port: this.options.port,
          connectTimeout: this.options.connectTimeout || 30000,
          reconnectStrategy: (retries) => {
            if (retries >= (this.options.maxAttempts || 10)) {
              return false;
            }
            return Math.min(retries * (this.options.retryDelayOnFailover || 2000), 10000);
          },
        },
      });

      this.client.on('error', (err) => {
        console.warn('Redis connection error:', err);
        this.connected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis connected successfully');
        this.connected = true;
      });

      await this.client.connect();
    } catch (error) {
      console.warn('Failed to connect to Redis:', error);
      this.connected = false;
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    try {
      await this.ensureConnection();
      if (!this.client || !this.connected) {
        return undefined;
      }
      const value: string | null = await this.client.get(key);
      return value ? (JSON.parse(value) as T) : undefined;
    } catch (error) {
      console.warn(`Redis get error for key ${key}:`, error);
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.ensureConnection();
      if (!this.client || !this.connected) {
        return;
      }
      const serialized: string = JSON.stringify(value);
      if (ttl) {
        await this.client.setEx(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      console.warn(`Redis set error for key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.ensureConnection();
      if (!this.client || !this.connected) {
        return;
      }
      await this.client.del(key);
    } catch (error) {
      console.warn(`Redis delete error for key ${key}:`, error);
    }
  }

  async reset(): Promise<void> {
    try {
      await this.ensureConnection();
      if (!this.client || !this.connected) {
        return;
      }
      await this.client.flushAll();
    } catch (error) {
      console.warn('Redis reset error:', error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.connected = false;
    }
  }
}
