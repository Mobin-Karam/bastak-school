import { MigrationInterface, QueryRunner } from "typeorm";

/** Stores the all-dorm attendant separately from per-room checks. */
export class DormAttendancePrimaryAndRoomChecks1762800000000 implements MigrationInterface {
  name = "DormAttendancePrimaryAndRoomChecks1762800000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS dorm_wide_attendance_delegates (
      id varchar(36) NOT NULL PRIMARY KEY,
      organizationId varchar(36) NOT NULL,
      studentId varchar(36) NOT NULL,
      grantedById varchar(36),
      startsOn varchar(10) NOT NULL,
      endsOn varchar(10) NOT NULL,
      revoked boolean NOT NULL DEFAULT 0,
      createdAt datetime NOT NULL DEFAULT (datetime('now')),
      updatedAt datetime NOT NULL DEFAULT (datetime('now')),
      CONSTRAINT FK_dorm_wide_delegate_organization FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE,
      CONSTRAINT FK_dorm_wide_delegate_student FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
      CONSTRAINT FK_dorm_wide_delegate_granted_by FOREIGN KEY (grantedById) REFERENCES users(id) ON DELETE SET NULL
    )`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS dorm_room_attendance_delegates (
      id varchar(36) NOT NULL PRIMARY KEY,
      organizationId varchar(36) NOT NULL,
      roomId varchar(36) NOT NULL,
      studentId varchar(36) NOT NULL,
      grantedById varchar(36),
      startsOn varchar(10) NOT NULL,
      endsOn varchar(10) NOT NULL,
      revoked boolean NOT NULL DEFAULT 0,
      createdAt datetime NOT NULL DEFAULT (datetime('now')),
      updatedAt datetime NOT NULL DEFAULT (datetime('now')),
      CONSTRAINT FK_dorm_room_delegate_organization FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE,
      CONSTRAINT FK_dorm_room_delegate_room FOREIGN KEY (roomId) REFERENCES dorm_rooms(id) ON DELETE CASCADE,
      CONSTRAINT FK_dorm_room_delegate_student FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
      CONSTRAINT FK_dorm_room_delegate_granted_by FOREIGN KEY (grantedById) REFERENCES users(id) ON DELETE SET NULL
    )`);
    await queryRunner.query(
      "CREATE UNIQUE INDEX IF NOT EXISTS UQ_dorm_wide_attendance_delegate_org ON dorm_wide_attendance_delegates(organizationId)",
    );
    await queryRunner.query(
      "CREATE UNIQUE INDEX IF NOT EXISTS UQ_dorm_room_attendance_delegate_room ON dorm_room_attendance_delegates(roomId)",
    );

    const sessionColumns = (await queryRunner.query(
      "PRAGMA table_info(attendance_sessions)",
    )) as Array<{ name: string }>;
    const existing = new Set(sessionColumns.map((column) => column.name));
    for (const [name, type] of [
      ["dormAttendanceRole", "varchar(16)"],
      ["dormDelegateStudentIdSnapshot", "varchar(36)"],
      ["dormDelegateStudentNameSnapshot", "varchar(160)"],
    ] as const) {
      if (!existing.has(name)) {
        await queryRunner.query(
          `ALTER TABLE attendance_sessions ADD COLUMN ${name} ${type}`,
        );
      }
    }
  }

  async down(): Promise<void> {
    // Keep additive attendance history and responsibility tables on rollback.
  }
}
