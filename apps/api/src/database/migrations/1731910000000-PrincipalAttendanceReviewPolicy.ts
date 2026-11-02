import { MigrationInterface, QueryRunner } from "typeorm";

/** Adds an explicit, organization-owned daily principal review policy. */
export class PrincipalAttendanceReviewPolicy1731910000000 implements MigrationInterface {
  name = "PrincipalAttendanceReviewPolicy1731910000000";

  async up(q: QueryRunner): Promise<void> {
    if (!(await q.hasColumn("attendance_policies", "principalReviewMode")))
      await q.query("ALTER TABLE attendance_policies ADD COLUMN principalReviewMode varchar(32) NOT NULL DEFAULT 'absences_only'");
  }

  async down(q: QueryRunner): Promise<void> {
    // SQLite requires a table rebuild to remove a column; production migrations are forward-only.
    void q;
    throw new Error("Principal attendance review policy is forward-only.");
  }
}
