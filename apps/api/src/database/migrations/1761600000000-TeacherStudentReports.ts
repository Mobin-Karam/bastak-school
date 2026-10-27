import { MigrationInterface, QueryRunner } from "typeorm";

export class TeacherStudentReports1761600000000 implements MigrationInterface {
  name = "TeacherStudentReports1761600000000";
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE teacher_student_reports (id varchar PRIMARY KEY NOT NULL, message varchar(2000) NOT NULL, seenAt datetime, createdAt datetime NOT NULL DEFAULT (datetime('now')), organizationId varchar NOT NULL, studentId varchar NOT NULL, sessionId varchar NOT NULL, teacherId varchar NOT NULL, seenById varchar, CONSTRAINT FK_teacher_report_org FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE, CONSTRAINT FK_teacher_report_student FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE, CONSTRAINT FK_teacher_report_session FOREIGN KEY (sessionId) REFERENCES attendance_sessions(id) ON DELETE CASCADE, CONSTRAINT FK_teacher_report_teacher FOREIGN KEY (teacherId) REFERENCES users(id) ON DELETE RESTRICT, CONSTRAINT FK_teacher_report_seen_by FOREIGN KEY (seenById) REFERENCES users(id) ON DELETE SET NULL)`,
    );
    await queryRunner.query(
      `CREATE INDEX IDX_teacher_report_org_seen ON teacher_student_reports (organizationId, seenAt)`,
    );
    await queryRunner.query(
      `CREATE INDEX IDX_teacher_report_student_created ON teacher_student_reports (studentId, createdAt)`,
    );
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE teacher_student_reports`);
  }
}
