import { MigrationInterface, QueryRunner } from "typeorm";

export class AttendanceSessionStudentCoins1762300900000 implements MigrationInterface {
  name = "AttendanceSessionStudentCoins1762300900000";
  async up(q: QueryRunner) {
    await q.query(
      `CREATE TABLE attendance_session_student_coins (id varchar PRIMARY KEY NOT NULL, coins integer NOT NULL DEFAULT 0, revision integer NOT NULL DEFAULT 0, createdAt datetime NOT NULL DEFAULT (datetime('now')), updatedAt datetime NOT NULL DEFAULT (datetime('now')), sessionId varchar NOT NULL, studentId varchar NOT NULL, recordedById varchar, CONSTRAINT UQ_attendance_session_student_coin UNIQUE(sessionId, studentId), FOREIGN KEY(sessionId) REFERENCES attendance_sessions(id) ON DELETE CASCADE, FOREIGN KEY(studentId) REFERENCES students(id) ON DELETE CASCADE, FOREIGN KEY(recordedById) REFERENCES users(id) ON DELETE SET NULL)`,
    );
  }
  async down(q: QueryRunner) {
    await q.query("DROP TABLE attendance_session_student_coins");
  }
}
