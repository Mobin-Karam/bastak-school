import { MigrationInterface, QueryRunner } from "typeorm";

export class WorkflowAttendanceLeaveLetters1724148100000 implements MigrationInterface {
  name = "WorkflowAttendanceLeaveLetters1724148100000";

  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TABLE attendance_sessions (id varchar PRIMARY KEY NOT NULL, organizationId varchar NOT NULL, contextType varchar(16) NOT NULL, contextId varchar(120) NOT NULL, sessionDate datetime NOT NULL, note text NOT NULL DEFAULT '', createdById varchar, createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT FK_attendance_session_org FOREIGN KEY(organizationId) REFERENCES organizations(id) ON DELETE CASCADE, CONSTRAINT FK_attendance_session_creator FOREIGN KEY(createdById) REFERENCES users(id) ON DELETE SET NULL)`);
    await q.query(`CREATE TABLE attendance_records (id varchar PRIMARY KEY NOT NULL, sessionId varchar NOT NULL, studentId varchar NOT NULL, status varchar(16) NOT NULL DEFAULT 'present', note text NOT NULL DEFAULT '', recordedById varchar, createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT FK_attendance_record_session FOREIGN KEY(sessionId) REFERENCES attendance_sessions(id) ON DELETE CASCADE, CONSTRAINT FK_attendance_record_student FOREIGN KEY(studentId) REFERENCES students(id) ON DELETE CASCADE, CONSTRAINT FK_attendance_record_user FOREIGN KEY(recordedById) REFERENCES users(id) ON DELETE SET NULL)`);
    await q.query(`CREATE TABLE leave_requests (id varchar PRIMARY KEY NOT NULL, organizationId varchar NOT NULL, studentId varchar NOT NULL, leaveType varchar(80) NOT NULL DEFAULT 'general', startDate datetime NOT NULL, endDate datetime NOT NULL, reason text NOT NULL, note text NOT NULL DEFAULT '', attachments text NOT NULL DEFAULT '', status varchar(16) NOT NULL DEFAULT 'PENDING', approverId varchar, reviewedAt datetime, createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT FK_leave_org FOREIGN KEY(organizationId) REFERENCES organizations(id) ON DELETE CASCADE, CONSTRAINT FK_leave_student FOREIGN KEY(studentId) REFERENCES students(id) ON DELETE CASCADE, CONSTRAINT FK_leave_approver FOREIGN KEY(approverId) REFERENCES users(id) ON DELETE SET NULL)`);
    await q.query(`CREATE TABLE exit_permissions (id varchar PRIMARY KEY NOT NULL, organizationId varchar NOT NULL, studentId varchar NOT NULL, requestedDepartureAt datetime NOT NULL, expectedReturnAt datetime, actualDepartureAt datetime, actualReturnAt datetime, destination varchar(200) NOT NULL, reason text NOT NULL, note text NOT NULL DEFAULT '', status varchar(16) NOT NULL DEFAULT 'PENDING', approverId varchar, reviewedAt datetime, createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT FK_exit_org FOREIGN KEY(organizationId) REFERENCES organizations(id) ON DELETE CASCADE, CONSTRAINT FK_exit_student FOREIGN KEY(studentId) REFERENCES students(id) ON DELETE CASCADE, CONSTRAINT FK_exit_approver FOREIGN KEY(approverId) REFERENCES users(id) ON DELETE SET NULL)`);
    await q.query(`CREATE TABLE request_letters (id varchar PRIMARY KEY NOT NULL, organizationId varchar NOT NULL, senderId varchar, recipientId varchar, recipientRole varchar(120) NOT NULL DEFAULT '', subject varchar(200) NOT NULL, body text NOT NULL, attachments text NOT NULL DEFAULT '', status varchar(18) NOT NULL DEFAULT 'DRAFT', priority varchar(24) NOT NULL DEFAULT 'normal', readAt datetime, respondedAt datetime, createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT FK_letter_org FOREIGN KEY(organizationId) REFERENCES organizations(id) ON DELETE CASCADE, CONSTRAINT FK_letter_sender FOREIGN KEY(senderId) REFERENCES users(id) ON DELETE SET NULL, CONSTRAINT FK_letter_recipient FOREIGN KEY(recipientId) REFERENCES users(id) ON DELETE SET NULL)`);

    await q.query(`CREATE INDEX IDX_attendance_session_org_date ON attendance_sessions(organizationId, sessionDate)`);
    await q.query(`CREATE INDEX IDX_attendance_record_session_student ON attendance_records(sessionId, studentId)`);
    await q.query(`CREATE INDEX IDX_leave_org_status_created ON leave_requests(organizationId, status, createdAt)`);
    await q.query(`CREATE INDEX IDX_exit_org_status_created ON exit_permissions(organizationId, status, createdAt)`);
    await q.query(`CREATE INDEX IDX_letter_org_status_created ON request_letters(organizationId, status, createdAt)`);

    for (const code of ["attendance.read", "attendance.manage", "leave.read", "leave.manage", "exit.read", "exit.manage", "letters.read", "letters.manage"]) {
      await q.query(`INSERT OR IGNORE INTO permissions(id, code, description) VALUES(lower(hex(randomblob(16))), ?, '')`, [code]);
    }

    for (const [role, code] of [
      ["STUDENT", "attendance.read"],
      ["STUDENT", "leave.read"],
      ["STUDENT", "leave.manage"],
      ["STUDENT", "exit.read"],
      ["STUDENT", "exit.manage"],
      ["STUDENT", "letters.read"],
      ["STUDENT", "letters.manage"],
      ["ADVISOR", "attendance.read"],
      ["ADVISOR", "attendance.manage"],
      ["ADVISOR", "leave.read"],
      ["ADVISOR", "leave.manage"],
      ["ADVISOR", "exit.read"],
      ["ADVISOR", "exit.manage"],
      ["ADVISOR", "letters.read"],
      ["ADVISOR", "letters.manage"],
      ["MENTOR", "attendance.read"],
      ["MENTOR", "attendance.manage"],
      ["MENTOR", "leave.read"],
      ["MENTOR", "leave.manage"],
      ["MENTOR", "exit.read"],
      ["MENTOR", "exit.manage"],
      ["MENTOR", "letters.read"],
      ["MENTOR", "letters.manage"],
      ["ORGANIZATION_ADMIN", "attendance.read"],
      ["ORGANIZATION_ADMIN", "attendance.manage"],
      ["ORGANIZATION_ADMIN", "leave.read"],
      ["ORGANIZATION_ADMIN", "leave.manage"],
      ["ORGANIZATION_ADMIN", "exit.read"],
      ["ORGANIZATION_ADMIN", "exit.manage"],
      ["ORGANIZATION_ADMIN", "letters.read"],
      ["ORGANIZATION_ADMIN", "letters.manage"],
      ["PLATFORM_ADMIN", "attendance.read"],
      ["PLATFORM_ADMIN", "attendance.manage"],
      ["PLATFORM_ADMIN", "leave.read"],
      ["PLATFORM_ADMIN", "leave.manage"],
      ["PLATFORM_ADMIN", "exit.read"],
      ["PLATFORM_ADMIN", "exit.manage"],
      ["PLATFORM_ADMIN", "letters.read"],
      ["PLATFORM_ADMIN", "letters.manage"],
    ]) {
      await q.query(`INSERT OR IGNORE INTO role_permissions(id, roleId, permissionId) SELECT lower(hex(randomblob(16))), r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.code=? AND p.code=?`, [role, code]);
    }
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE request_letters`);
    await q.query(`DROP TABLE exit_permissions`);
    await q.query(`DROP TABLE leave_requests`);
    await q.query(`DROP TABLE attendance_records`);
    await q.query(`DROP TABLE attendance_sessions`);

    for (const code of ["attendance.read", "attendance.manage", "leave.read", "leave.manage", "exit.read", "exit.manage", "letters.read", "letters.manage"]) {
      await q.query(`DELETE FROM role_permissions WHERE permissionId IN (SELECT id FROM permissions WHERE code=?)`, [code]);
      await q.query(`DELETE FROM permissions WHERE code=?`, [code]);
    }
  }
}
