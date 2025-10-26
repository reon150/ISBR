import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductsTable1761247210003 implements MigrationInterface {
  name = 'CreateProductsTable1761247210003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "sku" character varying(100) NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" text NOT NULL,
        "category_id" uuid NOT NULL,
        "price" numeric(10,2) NOT NULL,
        "currency" character varying(3) NOT NULL DEFAULT 'DOP',
        "stock_quantity" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" character varying NOT NULL,
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_by" character varying NOT NULL,
        "deleted_at" TIMESTAMP,
        "deleted_by" character varying,
        CONSTRAINT "UQ_products_sku" UNIQUE ("sku"),
        CONSTRAINT "PK_products_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "products"
      ADD CONSTRAINT "FK_products_category"
      FOREIGN KEY ("category_id")
      REFERENCES "categories"("id")
      ON DELETE RESTRICT
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_products_sku" ON "products" ("sku")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_products_category_id" ON "products" ("category_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_products_name" ON "products" ("name")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products" DROP CONSTRAINT "FK_products_category"
    `);

    await queryRunner.query(`DROP INDEX "IDX_products_name"`);
    await queryRunner.query(`DROP INDEX "IDX_products_category_id"`);
    await queryRunner.query(`DROP INDEX "IDX_products_sku"`);
    await queryRunner.query(`DROP TABLE "products"`);
  }
}
