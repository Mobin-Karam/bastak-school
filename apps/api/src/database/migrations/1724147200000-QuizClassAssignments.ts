import { MigrationInterface, QueryRunner } from "typeorm";

export class QuizClassAssignments1724147200000 implements MigrationInterface {
  name = "QuizClassAssignments1724147200000";
  async up(queryRunner: QueryRunner) {
    await queryRunner.query(`CREATE TABLE quiz_class_assignments (id varchar PRIMARY KEY NOT NULL, createdAt datetime NOT NULL DEFAULT (datetime('now')), quizId varchar NOT NULL, classroomId varchar NOT NULL, CONSTRAINT UQ_quiz_class_assignment UNIQUE (quizId, classroomId), CONSTRAINT FK_quiz_class_assignment_quiz FOREIGN KEY (quizId) REFERENCES quizzes(id) ON DELETE CASCADE, CONSTRAINT FK_quiz_class_assignment_classroom FOREIGN KEY (classroomId) REFERENCES education_classes(id) ON DELETE CASCADE)`);
    await queryRunner.query(`CREATE INDEX IDX_quiz_class_assignment_classroom ON quiz_class_assignments(classroomId)`);
  }
  async down(queryRunner: QueryRunner) { await queryRunner.query(`DROP TABLE quiz_class_assignments`); }
}
