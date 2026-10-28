import { MigrationInterface, QueryRunner } from "typeorm";

/** Leaves made before cycle tracking remain readable with an empty snapshot list. */
export class TeacherLeaveAcademicCycleSnapshots1762300500000 implements MigrationInterface {
  name = "TeacherLeaveAcademicCycleSnapshots1762300500000";

  async up(queryRunner: QueryRunner) {
    await queryRunner.query(`ALTER TABLE teacher_leave_requests ADD COLUMN academicCycleSnapshots text`);
  }

  async down(): Promise<void> {
    /* Preserve leave history and its academic provenance. */
  }
}
