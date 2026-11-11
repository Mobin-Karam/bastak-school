import { MigrationInterface, QueryRunner } from "typeorm";

export class ClassBookGrades1763600900000 implements MigrationInterface {
  name = "ClassBookGrades1763600900000";

  async up(q: QueryRunner): Promise<void> {
    await q.query(
      `CREATE TABLE class_book_grade_sessions (id varchar PRIMARY KEY NOT NULL, title varchar(160) NOT NULL, heldOn varchar(10) NOT NULL, description varchar(500) NOT NULL DEFAULT (''), createdAt datetime NOT NULL DEFAULT (datetime('now')), updatedAt datetime NOT NULL DEFAULT (datetime('now')), classBookId varchar NOT NULL, createdById varchar NOT NULL, CONSTRAINT FK_grade_session_book FOREIGN KEY (classBookId) REFERENCES education_class_books(id) ON DELETE RESTRICT, CONSTRAINT FK_grade_session_creator FOREIGN KEY (createdById) REFERENCES users(id) ON DELETE RESTRICT)`,
    );
    await q.query(
      `CREATE INDEX IDX_grade_session_book_date ON class_book_grade_sessions (classBookId, heldOn)`,
    );
    await q.query(
      `CREATE TABLE class_book_grades (id varchar PRIMARY KEY NOT NULL, score real NOT NULL, note varchar(500) NOT NULL DEFAULT (''), principalEditedAt datetime, createdAt datetime NOT NULL DEFAULT (datetime('now')), updatedAt datetime NOT NULL DEFAULT (datetime('now')), sessionId varchar NOT NULL, studentId varchar NOT NULL, updatedById varchar NOT NULL, CONSTRAINT FK_class_book_grades_session FOREIGN KEY (sessionId) REFERENCES class_book_grade_sessions(id) ON DELETE RESTRICT, CONSTRAINT FK_class_book_grades_student FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE, CONSTRAINT FK_class_book_grades_editor FOREIGN KEY (updatedById) REFERENCES users(id) ON DELETE RESTRICT)`,
    );
    await q.query(
      `CREATE UNIQUE INDEX IDX_class_book_grades_session_student ON class_book_grades (sessionId, studentId)`,
    );
    const grants: Record<string, string[]> = {
      "class_grades.read": [
        "PRINCIPAL",
        "RELIGIOUS_EDUCATION_MANAGER",
        "TEACHER",
      ],
      "class_grades.manage": ["PRINCIPAL", "TEACHER"],
      "class_grades.self.read": ["STUDENT"],
    };
    for (const [code, roles] of Object.entries(grants)) {
      await q.query(
        `INSERT OR IGNORE INTO permissions(id,code,description) VALUES(lower(hex(randomblob(16))),?,?)`,
        [code, code],
      );
      for (const role of roles)
        await q.query(
          `INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId) SELECT lower(hex(randomblob(16))),r.id,p.id FROM roles r,permissions p WHERE r.code=? AND p.code=?`,
          [role, code],
        );
    }
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE class_book_grades`);
    await q.query(`DROP TABLE class_book_grade_sessions`);
  }
}
