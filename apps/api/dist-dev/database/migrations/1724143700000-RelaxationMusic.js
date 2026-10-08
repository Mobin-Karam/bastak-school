"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelaxationMusic1724143700000 = void 0;
class RelaxationMusic1724143700000 {
    async up(q) {
        await q.query(`CREATE TABLE relaxation_tracks (id varchar PRIMARY KEY NOT NULL, title varchar(180) NOT NULL, artist varchar(120) NOT NULL DEFAULT (''), url varchar(1600) NOT NULL, active boolean NOT NULL DEFAULT (1), createdAt datetime NOT NULL DEFAULT (datetime('now')), updatedAt datetime NOT NULL DEFAULT (datetime('now')))`);
        await q.query(`CREATE TABLE student_daily_relaxations (id varchar PRIMARY KEY NOT NULL, date varchar(10) NOT NULL, selectedBy varchar(12) NOT NULL DEFAULT ('AUTO'), createdAt datetime NOT NULL DEFAULT (datetime('now')), updatedAt datetime NOT NULL DEFAULT (datetime('now')), studentId varchar, trackId varchar, CONSTRAINT FK_relaxation_student FOREIGN KEY (studentId) REFERENCES students (id) ON DELETE CASCADE, CONSTRAINT FK_relaxation_track FOREIGN KEY (trackId) REFERENCES relaxation_tracks (id) ON DELETE RESTRICT)`);
        await q.query(`CREATE UNIQUE INDEX IDX_student_daily_relaxation ON student_daily_relaxations (studentId, date)`);
    }
    async down(q) {
        await q.query(`DROP INDEX IDX_student_daily_relaxation`);
        await q.query(`DROP TABLE student_daily_relaxations`);
        await q.query(`DROP TABLE relaxation_tracks`);
    }
}
exports.RelaxationMusic1724143700000 = RelaxationMusic1724143700000;
//# sourceMappingURL=1724143700000-RelaxationMusic.js.map