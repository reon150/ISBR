import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDatabaseExtensions1761247209999 implements MigrationInterface {
  name = 'CreateDatabaseExtensions1761247209999';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
  }
}
