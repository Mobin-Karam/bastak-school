import { MigrationInterface, QueryRunner } from "typeorm";

export class EducationClasses1724146600000 implements MigrationInterface {
  name = "EducationClasses1724146600000";

  async up(queryRunner: QueryRunner) {
    await queryRunner.query(
      `CREATE TABLE education_classes (id varchar PRIMARY KEY NOT NULL, code varchar(80) NOT NULL, name varchar(160) NOT NULL, schoolYear varchar(16) NOT NULL, gradeId integer NOT NULL, educationTypeId varchar(40) NOT NULL, trackId varchar(80) NOT NULL, capacity integer NOT NULL DEFAULT (35), status varchar(20) NOT NULL DEFAULT ('ACTIVE'), description text NOT NULL DEFAULT (''), createdAt datetime NOT NULL DEFAULT (datetime('now')), updatedAt datetime NOT NULL DEFAULT (datetime('now')), organizationId varchar NOT NULL, advisorId varchar, CONSTRAINT UQ_education_class_organization_code UNIQUE (organizationId, code), CONSTRAINT FK_education_class_organization FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE, CONSTRAINT FK_education_class_advisor FOREIGN KEY (advisorId) REFERENCES users(id) ON DELETE SET NULL)`,
    );
    await queryRunner.query(
      `CREATE INDEX IDX_education_class_organization ON education_classes(organizationId)`,
    );
    await queryRunner.query(
      `CREATE INDEX IDX_education_class_profile ON education_classes(gradeId, educationTypeId, trackId)`,
    );
    await queryRunner.query(
      `CREATE TABLE education_class_books (id varchar PRIMARY KEY NOT NULL, createdAt datetime NOT NULL DEFAULT (datetime('now')), classroomId varchar NOT NULL, bookId varchar(120) NOT NULL, teacherId varchar NOT NULL, CONSTRAINT UQ_education_class_book UNIQUE (classroomId, bookId), CONSTRAINT FK_education_class_book_class FOREIGN KEY (classroomId) REFERENCES education_classes(id) ON DELETE CASCADE, CONSTRAINT FK_education_class_book_book FOREIGN KEY (bookId) REFERENCES education_books(id) ON DELETE RESTRICT, CONSTRAINT FK_education_class_book_teacher FOREIGN KEY (teacherId) REFERENCES users(id) ON DELETE RESTRICT)`,
    );
    await queryRunner.query(
      `CREATE INDEX IDX_education_class_book_teacher ON education_class_books(teacherId)`,
    );
    await queryRunner.query(
      `CREATE TABLE education_class_enrollments (id varchar PRIMARY KEY NOT NULL, createdAt datetime NOT NULL DEFAULT (datetime('now')), classroomId varchar NOT NULL, studentId varchar NOT NULL, CONSTRAINT UQ_education_class_enrollment UNIQUE (classroomId, studentId), CONSTRAINT FK_education_class_enrollment_class FOREIGN KEY (classroomId) REFERENCES education_classes(id) ON DELETE CASCADE, CONSTRAINT FK_education_class_enrollment_student FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE)`,
    );
    await queryRunner.query(
      `CREATE INDEX IDX_education_class_enrollment_student ON education_class_enrollments(studentId)`,
    );
    const permissions = [
      ["classes.read", "View assigned organization classes"],
      ["classes.manage", "Create and manage organization classes"],
      ["classes.roster.manage", "Manage class student enrollment"],
    ];
    for (const [code, description] of permissions)
      await queryRunner.query(
        `INSERT OR IGNORE INTO permissions(id,code,description) VALUES(lower(hex(randomblob(16))),?,?)`,
        [code, description],
      );
    await queryRunner.query(
      `INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId) SELECT lower(hex(randomblob(16))),r.id,p.id FROM roles r CROSS JOIN permissions p WHERE (p.code='classes.read' AND r.code IN ('STUDENT','GUARDIAN','ADVISOR','TEACHER','MENTOR','ORGANIZATION_ADMIN','PLATFORM_ADMIN')) OR (p.code='classes.manage' AND r.code IN ('ORGANIZATION_ADMIN','PLATFORM_ADMIN')) OR (p.code='classes.roster.manage' AND r.code IN ('ADVISOR','MENTOR','ORGANIZATION_ADMIN','PLATFORM_ADMIN'))`,
    );
  }

  async down(queryRunner: QueryRunner) {
    await queryRunner.query(`DROP TABLE education_class_enrollments`);
    await queryRunner.query(`DROP TABLE education_class_books`);
    await queryRunner.query(`DROP TABLE education_classes`);
  }
}
