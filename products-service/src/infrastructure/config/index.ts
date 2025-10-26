export * from './env.validation';
export { default as configuration, AppConfiguration } from './configuration';

import { ConfigService } from '@nestjs/config';
import { AppConfiguration } from './configuration';

export function getConfig(configService: ConfigService): AppConfiguration {
  return {
    nodeEnv: configService.get('nodeEnv')!,
    port: configService.get('port')!,
    database: {
      host: configService.get('database.host')!,
      port: configService.get('database.port')!,
      username: configService.get('database.username')!,
      password: configService.get('database.password')!,
      name: configService.get('database.name')!,
    },
    redis: {
      host: configService.get('redis.host')!,
      port: configService.get('redis.port')!,
    },
    kafka: {
      brokers: configService.get('kafka.brokers')!,
      clientId: configService.get('kafka.clientId')!,
      groupId: configService.get('kafka.groupId')!,
      sessionTimeout: configService.get('kafka.sessionTimeout')!,
      heartbeatInterval: configService.get('kafka.heartbeatInterval')!,
      initialRetryTime: configService.get('kafka.initialRetryTime')!,
      maxRetries: configService.get('kafka.maxRetries')!,
      transactionTimeout: configService.get('kafka.transactionTimeout')!,
    },
    jwt: {
      secret: configService.get('jwt.secret')!,
      expiration: configService.get('jwt.expiration')!,
    },
    exchangeRate: {
      apiKey: configService.get('exchangeRate.apiKey')!,
      apiUrl: configService.get('exchangeRate.apiUrl')!,
    },
    cache: {
      ttl: {
        products: configService.get('cache.ttl.products')!,
        exchangeRates: configService.get('cache.ttl.exchangeRates')!,
      },
    },
    logs: {
      dir: configService.get('logs.dir')!,
      maxErrorLogs: configService.get('logs.maxErrorLogs')!,
    },
    scheduler: {
      eventRetentionDays: configService.get('scheduler.eventRetentionDays')!,
      eventCleanupCron: configService.get('scheduler.eventCleanupCron')!,
    },
  };
}
