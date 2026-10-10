import { MigrationInterface, QueryRunner } from "typeorm";

export class ScheduleClassBooks1729800000000 implements MigrationInterface {
  name = "ScheduleClassBooks1729800000000";
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE school_schedule_entries ADD COLUMN classBookId varchar");
    await queryRunner.query("CREATE INDEX IDX_schedule_class_book ON school_schedule_entries(classBookId)");
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP INDEX IDX_schedule_class_book");
    await queryRunner.query("ALTER TABLE school_schedule_entries DROP COLUMN classBookId");
  }
}
