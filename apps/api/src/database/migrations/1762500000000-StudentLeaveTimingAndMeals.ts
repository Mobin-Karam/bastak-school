import { MigrationInterface, QueryRunner } from "typeorm";

/** Additive fields preserve every existing leave request and make departure timing explicit. */
export class StudentLeaveTimingAndMeals1762500000000 implements MigrationInterface {
  name = "StudentLeaveTimingAndMeals1762500000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE leave_requests ADD COLUMN includesLunch boolean NOT NULL DEFAULT 0",
    );
    await queryRunner.query(
      "ALTER TABLE leave_requests ADD COLUMN includesDinner boolean NOT NULL DEFAULT 0",
    );
    await queryRunner.query(
      "ALTER TABLE leave_requests ADD COLUMN exitPermissionId varchar",
    );
    await queryRunner.query(
      "CREATE INDEX IF NOT EXISTS IDX_leave_requests_exit_permission ON leave_requests(exitPermissionId)",
    );
  }

  async down(): Promise<void> {
    // SQLite-compatible rollback keeps additive columns; prior application versions ignore them.
  }
}
