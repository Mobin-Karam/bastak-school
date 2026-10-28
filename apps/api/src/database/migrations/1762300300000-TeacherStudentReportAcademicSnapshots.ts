import { MigrationInterface, QueryRunner } from "typeorm";

/** Existing private reports stay readable; new reports snapshot their attendance cycle. */
export class TeacherStudentReportAcademicSnapshots1762300300000 implements MigrationInterface {
  name = "TeacherStudentReportAcademicSnapshots1762300300000";

  async up(queryRunner: QueryRunner) {
    await queryRunner.query(`ALTER TABLE teacher_student_reports ADD COLUMN academicYearIdSnapshot varchar(36)`);
    await queryRunner.query(`ALTER TABLE teacher_student_reports ADD COLUMN academicYearNameSnapshot varchar(120)`);
    await queryRunner.query(`ALTER TABLE teacher_student_reports ADD COLUMN termIdSnapshot varchar(36)`);
    await queryRunner.query(`ALTER TABLE teacher_student_reports ADD COLUMN termNameSnapshot varchar(120)`);
    await queryRunner.query(
      `CREATE INDEX IDX_teacher_report_academic_cycle ON teacher_student_reports(academicYearIdSnapshot, termIdSnapshot)`,
    );
  }

  async down(): Promise<void> {
    /* Preserve report provenance in production databases. */
  }
}
