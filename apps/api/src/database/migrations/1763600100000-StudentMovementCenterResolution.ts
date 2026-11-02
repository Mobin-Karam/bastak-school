import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Some development and early rollout databases recorded the initial movement
 * center migration before the overdue-resolution field was introduced. Keep
 * those databases readable without replaying an already-recorded migration.
 */
export class StudentMovementCenterResolution1763600100000 implements MigrationInterface {
  name = "StudentMovementCenterResolution1763600100000";

  async up(queryRunner: QueryRunner): Promise<void> {
    const columns = (await queryRunner.query(
      "PRAGMA table_info(exit_permissions)",
    )) as Array<{ name: string }>;

    if (!columns.some((column) => column.name === "resolution")) {
      await queryRunner.query(
        "ALTER TABLE exit_permissions ADD COLUMN resolution varchar(32)",
      );
    }
  }

  async down(): Promise<void> {
    // SQLite cannot safely drop this compatibility column without rebuilding
    // the retained movement ledger. Forward migrations keep it nullable.
  }
}
