import { MigrationInterface, QueryRunner } from "typeorm";

export class TeacherStudentReportPrincipalActions1762301000000 implements MigrationInterface {
  name = "TeacherStudentReportPrincipalActions1762301000000";

  async up(queryRunner: QueryRunner) {
    await queryRunner.query(
      "ALTER TABLE teacher_student_reports ADD COLUMN principalAction varchar(32)",
    );
    await queryRunner.query(
      "ALTER TABLE teacher_student_reports ADD COLUMN principalActionNote text NOT NULL DEFAULT ''",
    );
    await queryRunner.query(
      "ALTER TABLE teacher_student_reports ADD COLUMN principalActionAt datetime",
    );
    await queryRunner.query(
      "ALTER TABLE teacher_student_reports ADD COLUMN principalActionById varchar",
    );
    await queryRunner.query(
      "CREATE INDEX IF NOT EXISTS IDX_teacher_report_principal_action ON teacher_student_reports(principalActionAt)",
    );
    await queryRunner.query(
      "CREATE INDEX IF NOT EXISTS IDX_teacher_report_principal_action_by ON teacher_student_reports(principalActionById)",
    );
  }

  async down(queryRunner: QueryRunner) {
    await queryRunner.query(
      "DROP INDEX IF EXISTS IDX_teacher_report_principal_action_by",
    );
    await queryRunner.query(
      "DROP INDEX IF EXISTS IDX_teacher_report_principal_action",
    );
    await queryRunner.query(
      "ALTER TABLE teacher_student_reports DROP COLUMN principalActionById",
    );
    await queryRunner.query(
      "ALTER TABLE teacher_student_reports DROP COLUMN principalActionAt",
    );
    await queryRunner.query(
      "ALTER TABLE teacher_student_reports DROP COLUMN principalActionNote",
    );
    await queryRunner.query(
      "ALTER TABLE teacher_student_reports DROP COLUMN principalAction",
    );
  }
}
