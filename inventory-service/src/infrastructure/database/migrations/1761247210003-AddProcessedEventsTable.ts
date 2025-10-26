import type { MigrationInterface, QueryRunner } from 'typeorm';
import { Table, TableIndex } from 'typeorm';

export class AddProcessedEventsTable1761247210003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'processed_events',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'event_id',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'event_type',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'event_data',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'processing_result',
            type: 'varchar',
            length: '50',
            default: "'success'",
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'processed_events',
      new TableIndex({
        name: 'IDX_PROCESSED_EVENTS_EVENT_ID',
        columnNames: ['event_id'],
      }),
    );

    await queryRunner.createIndex(
      'processed_events',
      new TableIndex({
        name: 'IDX_PROCESSED_EVENTS_EVENT_TYPE',
        columnNames: ['event_type'],
      }),
    );

    await queryRunner.createIndex(
      'processed_events',
      new TableIndex({
        name: 'IDX_PROCESSED_EVENTS_TYPE_DATE',
        columnNames: ['event_type', 'created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('processed_events', true);
  }
}
