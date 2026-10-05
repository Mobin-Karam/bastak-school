import { MigrationInterface, QueryRunner } from "typeorm";

export class ExamAudienceRules1724147600000 implements MigrationInterface {
  name = "ExamAudienceRules1724147600000";
  async up(queryRunner: QueryRunner) {
    await queryRunner.query(
      'ALTER TABLE exams ADD COLUMN audienceRules text NOT NULL DEFAULT (\'{"gradeIds":[],"educationTypeIds":[],"trackIds":[],"learnerProfiles":[],"independentTypes":[]}\')',
    );
    await queryRunner.query(
      "CREATE TABLE exam_class_assignments (id varchar PRIMARY KEY NOT NULL, createdAt datetime NOT NULL DEFAULT (datetime('now')), examId varchar NOT NULL, classroomId varchar NOT NULL, CONSTRAINT UQ_exam_class_assignment UNIQUE (examId, classroomId), CONSTRAINT FK_exam_class_assignment_exam FOREIGN KEY (examId) REFERENCES exams(id) ON DELETE CASCADE, CONSTRAINT FK_exam_class_assignment_class FOREIGN KEY (classroomId) REFERENCES education_classes(id) ON DELETE CASCADE)",
    );
  }
  async down(queryRunner: QueryRunner) {
    await queryRunner.query("DROP TABLE exam_class_assignments");
    await queryRunner.query("ALTER TABLE exams DROP COLUMN audienceRules");
  }
}
