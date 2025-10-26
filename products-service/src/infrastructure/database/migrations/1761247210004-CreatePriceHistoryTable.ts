import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePriceHistoryTable1761247210004 implements MigrationInterface {
  name = 'CreatePriceHistoryTable1761247210004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "price_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "product_id" uuid NOT NULL,
        "old_price" numeric(10,2) NOT NULL,
        "new_price" numeric(10,2) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" character varying NOT NULL,
        CONSTRAINT "PK_price_history_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "price_history"
      ADD CONSTRAINT "FK_price_history_product"
      FOREIGN KEY ("product_id")
      REFERENCES "products"("id")
      ON DELETE RESTRICT
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_price_history_product_id" ON "price_history" ("product_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_price_history_created_at" ON "price_history" ("created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "price_history" DROP CONSTRAINT "FK_price_history_product"
    `);

    await queryRunner.query(`DROP INDEX "IDX_price_history_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_price_history_product_id"`);
    await queryRunner.query(`DROP TABLE "price_history"`);
  }
}
