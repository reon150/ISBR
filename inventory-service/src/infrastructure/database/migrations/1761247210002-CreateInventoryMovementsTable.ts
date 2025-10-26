import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInventoryMovementsTable1761247210002 implements MigrationInterface {
  name = 'CreateInventoryMovementsTable1761247210002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "inventory_movements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "inventory_id" uuid NOT NULL,
        "type" character varying NOT NULL,
        "quantity" bigint NOT NULL,
        "quantity_before" bigint NOT NULL,
        "quantity_after" bigint NOT NULL,
        "reason" text,
        "reference" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" character varying NOT NULL,
        "metadata" jsonb,
        CONSTRAINT "PK_inventory_movements_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "inventory_movements"
      ADD CONSTRAINT "FK_inventory_movements_inventory"
      FOREIGN KEY ("inventory_id")
      REFERENCES "inventory"("id")
      ON DELETE RESTRICT
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_inventory_movements_inventory_id" ON "inventory_movements" ("inventory_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_inventory_movements_type" ON "inventory_movements" ("type")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_inventory_movements_created_at" ON "inventory_movements" ("created_at")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_inventory_movements_reference" ON "inventory_movements" ("reference")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "inventory_movements" DROP CONSTRAINT "FK_inventory_movements_inventory"
    `);

    await queryRunner.query(`DROP INDEX "IDX_inventory_movements_reference"`);
    await queryRunner.query(`DROP INDEX "IDX_inventory_movements_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_inventory_movements_type"`);
    await queryRunner.query(`DROP INDEX "IDX_inventory_movements_inventory_id"`);
    await queryRunner.query(`DROP TABLE "inventory_movements"`);
  }
}
