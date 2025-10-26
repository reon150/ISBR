import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserRoleEnum1761247210000 implements MigrationInterface {
  name = 'CreateUserRoleEnum1761247210000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."user_role_enum" AS ENUM ('ADMIN', 'USER')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
  }
}
