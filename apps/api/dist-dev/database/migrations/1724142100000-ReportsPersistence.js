"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsPersistence1724142100000 = void 0;
class ReportsPersistence1724142100000 {
    name = "ReportsPersistence1724142100000";
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS daily_reports(
      id varchar PRIMARY KEY NOT NULL,
      planDate date NOT NULL,
      studyHours float NOT NULL DEFAULT 0,
      tests integer NOT NULL DEFAULT 0,
      correct integer NOT NULL DEFAULT 0,
      wrong integer NOT NULL DEFAULT 0,
      blank integer NOT NULL DEFAULT 0,
      focus integer NOT NULL DEFAULT 0,
      fatigue integer NOT NULL DEFAULT 0,
      motivation integer NOT NULL DEFAULT 0,
      problem varchar(2000) NOT NULL DEFAULT '',
      tomorrow varchar(2000) NOT NULL DEFAULT '',
      createdAt datetime NOT NULL DEFAULT (datetime('now')),
      updatedAt datetime NOT NULL DEFAULT (datetime('now')),
      studentId varchar NOT NULL,
      CONSTRAINT FK_daily_report_student FOREIGN KEY(studentId) REFERENCES students(id) ON DELETE CASCADE
    )`);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS IDX_daily_report_student_date ON daily_reports(studentId,planDate)`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS recovery_requests(
      id varchar PRIMARY KEY NOT NULL,
      planDate date NOT NULL,
      reason varchar(200) NOT NULL DEFAULT '',
      note varchar(1500) NOT NULL DEFAULT '',
      status varchar(24) NOT NULL DEFAULT 'pending',
      createdAt datetime NOT NULL DEFAULT (datetime('now')),
      updatedAt datetime NOT NULL DEFAULT (datetime('now')),
      studentId varchar NOT NULL,
      CONSTRAINT FK_recovery_student FOREIGN KEY(studentId) REFERENCES students(id) ON DELETE CASCADE
    )`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS IDX_recovery_student ON recovery_requests(studentId,createdAt)`);
    }
    async down(queryRunner) {
        await queryRunner.query("DROP TABLE IF EXISTS recovery_requests");
        await queryRunner.query("DROP TABLE IF EXISTS daily_reports");
    }
}
exports.ReportsPersistence1724142100000 = ReportsPersistence1724142100000;
//# sourceMappingURL=1724142100000-ReportsPersistence.js.map