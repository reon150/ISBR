import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCategoriesTable1761247210002 implements MigrationInterface {
  name = 'CreateCategoriesTable1761247210002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "description" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" character varying NOT NULL,
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_by" character varying NOT NULL,
        "deleted_at" TIMESTAMP,
        "deleted_by" character varying,
        CONSTRAINT "UQ_categories_name" UNIQUE ("name"),
        CONSTRAINT "PK_categories_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_categories_name" ON "categories" ("name")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_categories_name"`);
    await queryRunner.query(`DROP TABLE "categories"`);
  }
}
