import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Kafka,
  Consumer,
  Producer,
  EachMessagePayload,
  ProducerRecord,
  RecordMetadata,
  logLevel,
} from 'kafkajs';
import * as crypto from 'crypto';
import { getConfig, AppConfiguration } from '../config';

export interface KafkaMessage<T = Record<string, unknown>> {
  eventId: string;
  eventType: string;
  data: T;
  timestamp: number;
}

export type MessageHandler<T = Record<string, unknown>> = (message: T) => Promise<void>;

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka | null = null;
  private consumer: Consumer | null = null;
  private producer: Producer | null = null;
  private readonly brokers: string[];
  private readonly clientId: string;
  private readonly groupId: string;
  private messageHandlers: Map<string, MessageHandler> = new Map();

  constructor(private readonly configService: ConfigService) {
    const config: AppConfiguration = getConfig(this.configService);

    this.brokers = config.kafka.brokers.split(',');
    this.clientId = config.kafka.clientId;
    this.groupId = config.kafka.groupId;
  }

  async onModuleInit() {
    this.logger.log('KafkaService initialized - will connect when needed');
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    try {
      if (this.producer && this.consumer) {
        return;
      }

      if (!this.kafka) {
        const config: AppConfiguration = getConfig(this.configService);

        this.kafka = new Kafka({
          clientId: this.clientId,
          brokers: this.brokers,
          logLevel: logLevel.INFO,
          retry: {
            initialRetryTime: config.kafka.initialRetryTime,
            retries: config.kafka.maxRetries,
          },
        });

        this.consumer = this.kafka.consumer({
          groupId: this.groupId,
          sessionTimeout: config.kafka.sessionTimeout,
          heartbeatInterval: config.kafka.heartbeatInterval,
        });

        this.producer = this.kafka.producer({
          allowAutoTopicCreation: true,
          transactionTimeout: config.kafka.transactionTimeout,
        });
      }

      await Promise.all([this.consumer!.connect(), this.producer!.connect()]);
      this.logger.log(`Kafka connected to: ${this.brokers.join(', ')}`);
    } catch (error) {
      this.logger.error('Error connecting to Kafka:', error);
      throw error;
    }
  }

  private isConsumerRunning = false;
  private topicsToSubscribe: Array<{ topic: string; handler: MessageHandler }> = [];

  async subscribe<T = Record<string, unknown>>(
    topic: string,
    handler: MessageHandler<T>,
  ): Promise<void> {
    try {
      this.messageHandlers.set(topic, handler as MessageHandler);
      this.topicsToSubscribe.push({ topic, handler: handler as MessageHandler });
    } catch (error) {
      this.logger.error(`Error registering handler for topic ${topic}:`, error);
      throw error;
    }
  }

  async startConsumer(): Promise<void> {
    if (this.isConsumerRunning || this.topicsToSubscribe.length === 0) {
      return;
    }

    try {
      await this.connect();

      for (const { topic } of this.topicsToSubscribe) {
        await this.consumer!.subscribe({ topic, fromBeginning: false });
        this.logger.log(`Subscribed to topic: ${topic}`);
      }

      this.isConsumerRunning = true;
      await this.consumer!.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });
    } catch (error) {
      this.logger.error('Error starting consumer:', error);
      throw error;
    }
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;

    try {
      const messageValue: string | undefined = message.value?.toString();
      if (!messageValue) {
        this.logger.warn(`Received empty message from topic ${topic}`);
        return;
      }

      const parsedMessage: KafkaMessage = JSON.parse(messageValue) as KafkaMessage;

      this.logger.log(
        `Received message from topic ${topic}, partition ${partition}, offset ${message.offset}`,
      );

      const handler: MessageHandler | undefined = this.messageHandlers.get(topic);
      if (!handler) {
        this.logger.warn(`No handler registered for topic: ${topic}`);
        return;
      }

      await handler(parsedMessage.data);

      this.logger.log(`Message processed successfully from topic ${topic}`);
    } catch (error) {
      const errorMessage: string = error instanceof Error ? error.message : 'Unknown error';
      const errorStack: string | undefined = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error processing message from topic ${topic}:`, errorMessage, errorStack);
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.producer && this.consumer) {
        await Promise.all([this.consumer.disconnect(), this.producer.disconnect()]);
        this.logger.log('Kafka disconnected');
      }
    } catch (error) {
      this.logger.error('Error disconnecting from Kafka:', error);
    }
  }

  async publish<T = Record<string, unknown>>(topic: string, message: T): Promise<boolean> {
    try {
      await this.connect();

      const kafkaMessage: KafkaMessage<T> = {
        eventId: this.generateEventId(),
        eventType: topic,
        data: message,
        timestamp: Date.now(),
      };

      const messageData: Record<string, unknown> = message as Record<string, unknown>;
      const messageKey: string =
        (messageData.productId as string) ||
        (messageData.inventoryId as string) ||
        (messageData.id as string) ||
        kafkaMessage.eventId;

      const record: ProducerRecord = {
        topic,
        messages: [
          {
            key: messageKey,
            value: JSON.stringify(kafkaMessage),
            headers: {
              eventId: kafkaMessage.eventId,
              eventType: topic,
              timestamp: kafkaMessage.timestamp.toString(),
            },
          },
        ],
      };

      const result: RecordMetadata[] = await this.producer!.send(record);

      this.logger.log(
        `Published message to topic ${topic}: ${kafkaMessage.eventId} - Partition: ${result[0].partition}, Offset: ${result[0].baseOffset}`,
      );

      return true;
    } catch (error) {
      this.logger.error(`Error publishing message to topic ${topic}:`, error);
      return false;
    }
  }

  private generateEventId(): string {
    return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
  }

  async seekToOffset(topic: string, partition: number, offset: string): Promise<void> {
    await this.consumer!.seek({ topic, partition, offset });
    this.logger.log(`Seeked to offset ${offset} on topic ${topic}, partition ${partition}`);
  }

  async pauseTopic(topic: string): Promise<void> {
    await this.consumer!.pause([{ topic }]);
    this.logger.log(`Paused consumption for topic: ${topic}`);
  }

  async resumeTopic(topic: string): Promise<void> {
    await this.consumer!.resume([{ topic }]);
    this.logger.log(`Resumed consumption for topic: ${topic}`);
  }
}
