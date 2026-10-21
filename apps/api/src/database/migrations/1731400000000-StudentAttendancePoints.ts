import { MigrationInterface, QueryRunner } from "typeorm";

/** Attendance points are ledger entries so corrections do not erase their reason. */
export class StudentAttendancePoints1731400000000 implements MigrationInterface {
  name = "StudentAttendancePoints1731400000000";

  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TABLE student_point_ledger (id varchar PRIMARY KEY NOT NULL, points integer NOT NULL, source varchar(32) NOT NULL, requestId varchar, reason text NOT NULL, createdAt datetime NOT NULL DEFAULT (datetime('now')), studentId varchar NOT NULL, attendanceRecordId varchar, awardedById varchar, CONSTRAINT FK_student_point_ledger_student FOREIGN KEY(studentId) REFERENCES students(id) ON DELETE CASCADE, CONSTRAINT FK_student_point_ledger_attendance FOREIGN KEY(attendanceRecordId) REFERENCES attendance_records(id) ON DELETE CASCADE, CONSTRAINT FK_student_point_ledger_awarded_by FOREIGN KEY(awardedById) REFERENCES users(id) ON DELETE SET NULL)`);
    await q.query("CREATE UNIQUE INDEX UQ_student_point_ledger_attendance_record ON student_point_ledger(attendanceRecordId) WHERE attendanceRecordId IS NOT NULL");
    await q.query("CREATE INDEX IDX_student_point_ledger_student_created ON student_point_ledger(studentId,createdAt,id)");
    await q.query("CREATE UNIQUE INDEX UQ_student_point_ledger_request ON student_point_ledger(requestId) WHERE requestId IS NOT NULL");
    await q.query("INSERT OR IGNORE INTO permissions(id,code,description) VALUES(lower(hex(randomblob(16))),'attendance.points.adjust','اعطای امتیاز کلاسی با دلیل')");
    await q.query("INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId) SELECT lower(hex(randomblob(16))),r.id,p.id FROM roles r,permissions p WHERE r.code IN ('TEACHER','PRINCIPAL','SCHOOL_SUPERVISOR','ORGANIZATION_ADMIN','PLATFORM_ADMIN') AND p.code='attendance.points.adjust'");
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query("DROP TABLE student_point_ledger");
  }
}
