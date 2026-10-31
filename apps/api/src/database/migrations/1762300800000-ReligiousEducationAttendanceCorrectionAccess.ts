import { MigrationInterface, QueryRunner } from "typeorm";

/** Lets the academic manager correct ordinary class-attendance history with the same audited flow. */
export class ReligiousEducationAttendanceCorrectionAccess1762300800000 implements MigrationInterface {
  name = "ReligiousEducationAttendanceCorrectionAccess1762300800000";

  async up(q: QueryRunner) {
    await q.query(
      `INSERT OR IGNORE INTO permissions(id, code, description) VALUES(lower(hex(randomblob(16))), ?, ?)`,
      ["attendance.correct", "Attendance correction"],
    );
    await q.query(
      `INSERT OR IGNORE INTO role_permissions(id, roleId, permissionId)
       SELECT lower(hex(randomblob(16))), r.id, p.id
       FROM roles r, permissions p
       WHERE r.code = 'RELIGIOUS_EDUCATION_MANAGER' AND p.code = 'attendance.correct'`,
    );
  }

  async down(): Promise<void> {
    /* Capability grants are retained as append-only authorization history. */
  }
}
