import { MigrationInterface, QueryRunner } from "typeorm";
export class StudentSyncHealth1724146000000 implements MigrationInterface {
  name = "StudentSyncHealth1724146000000";
  async up(q: QueryRunner): Promise<void> { await q.query("CREATE TABLE student_sync_health (id varchar PRIMARY KEY NOT NULL, deviceId varchar(96) NOT NULL, status varchar(16) NOT NULL DEFAULT 'online', pendingCount integer NOT NULL DEFAULT 0, failureCode varchar(80), lastSuccessfulAt datetime, createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, studentId varchar, CONSTRAINT FK_student_sync_health_student FOREIGN KEY(studentId) REFERENCES students(id) ON DELETE CASCADE)"); await q.query("CREATE UNIQUE INDEX IDX_student_sync_health_student_device ON student_sync_health(studentId, deviceId)"); }
  async down(q: QueryRunner): Promise<void> { await q.query("DROP TABLE IF EXISTS student_sync_health"); }
}
