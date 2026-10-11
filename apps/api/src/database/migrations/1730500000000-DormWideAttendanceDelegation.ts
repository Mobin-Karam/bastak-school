import { MigrationInterface, QueryRunner } from "typeorm";
export class DormWideAttendanceDelegation1730500000000 implements MigrationInterface {
  name = "DormWideAttendanceDelegation1730500000000";
  async up(q: QueryRunner): Promise<void> { await q.query("ALTER TABLE dorm_attendance_delegates ADD COLUMN dormWide boolean NOT NULL DEFAULT 0"); }
  async down(q: QueryRunner): Promise<void> {
    if ((await q.query("SELECT COUNT(*) AS count FROM dorm_attendance_delegates WHERE dormWide = 1"))[0].count > 0) throw new Error("Saved dorm-wide grants require an application rollback.");
    await q.query("ALTER TABLE dorm_attendance_delegates DROP COLUMN dormWide");
  }
}
