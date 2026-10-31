import { MigrationInterface, QueryRunner } from "typeorm";
export class TeacherLeaveRequests1761900000000 implements MigrationInterface {
  name = "TeacherLeaveRequests1761900000000";
  async up(q: QueryRunner) {
    await q.query(
      `CREATE TABLE teacher_leave_requests (id varchar PRIMARY KEY NOT NULL, organizationId varchar NOT NULL, teacherId varchar NOT NULL, startDate varchar(10) NOT NULL, endDate varchar(10) NOT NULL, reason text NOT NULL, status varchar(16) NOT NULL DEFAULT 'pending', resolution varchar(16), substituteTeacherId varchar, reviewedById varchar, reviewedAt datetime, createdAt datetime NOT NULL DEFAULT (datetime('now')), FOREIGN KEY(organizationId) REFERENCES organizations(id) ON DELETE CASCADE, FOREIGN KEY(teacherId) REFERENCES users(id) ON DELETE RESTRICT, FOREIGN KEY(substituteTeacherId) REFERENCES users(id) ON DELETE RESTRICT)`,
    );
    await q.query(
      `CREATE INDEX IDX_teacher_leave_org_teacher_status ON teacher_leave_requests(organizationId, teacherId, status)`,
    );
  }
  async down(q: QueryRunner) {
    await q.query(`DROP TABLE teacher_leave_requests`);
  }
}
