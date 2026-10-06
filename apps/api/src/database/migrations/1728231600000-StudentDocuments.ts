import { MigrationInterface, QueryRunner } from "typeorm";

export class StudentDocuments1728231600000 implements MigrationInterface {
  name = "StudentDocuments1728231600000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS student_documents (
        id varchar PRIMARY KEY NOT NULL,
        studentId varchar NOT NULL,
        type varchar(48) NOT NULL,
        fileName varchar(255) NOT NULL,
        fileUrl varchar(255) NOT NULL,
        originalFileName varchar(255),
        status varchar(32) NOT NULL DEFAULT 'PENDING',
        verificationNote text,
        verifiedById varchar,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT FK_student_document_student
          FOREIGN KEY(studentId)
          REFERENCES students(id)
          ON DELETE CASCADE,

        CONSTRAINT FK_student_document_verified_by
          FOREIGN KEY(verifiedById)
          REFERENCES users(id)
          ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS IDX_student_documents_student_type
      ON student_documents(studentId, type)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE student_documents`);
  }
}
