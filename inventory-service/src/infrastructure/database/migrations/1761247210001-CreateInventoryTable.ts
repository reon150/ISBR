import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInventoryTable1761247210001 implements MigrationInterface {
  name = 'CreateInventoryTable1761247210001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "inventory" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "product_id" uuid NOT NULL,
        "quantity" bigint NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" character varying NOT NULL,
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_by" character varying NOT NULL,
        "deleted_at" TIMESTAMP,
        "deleted_by" character varying,
        CONSTRAINT "UQ_inventory_product_id" UNIQUE ("product_id"),
        CONSTRAINT "PK_inventory_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_inventory_product_id" ON "inventory" ("product_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_inventory_product_id"`);
    await queryRunner.query(`DROP TABLE "inventory"`);
  }
}
