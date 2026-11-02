import { MigrationInterface, QueryRunner } from "typeorm";

/** Adds the source marker used to distinguish approved exits from dorm breaches. */
export class DormUnauthorizedDepartureOrigin1762900000000 implements MigrationInterface {
  name = "DormUnauthorizedDepartureOrigin1762900000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    const columns = (await queryRunner.query(
      "PRAGMA table_info(exit_permissions)",
    )) as Array<{ name: string }>;
    if (!columns.some((column) => column.name === "origin")) {
      await queryRunner.query(
        "ALTER TABLE exit_permissions ADD COLUMN origin varchar(32)",
      );
    }
  }

  async down(): Promise<void> {
    // Keep the additive marker for retained departure records on rollback.
  }
}
