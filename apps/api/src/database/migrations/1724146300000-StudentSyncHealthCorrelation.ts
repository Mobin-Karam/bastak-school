import { MigrationInterface, QueryRunner } from "typeorm";

export class StudentSyncHealthCorrelation1724146300000 implements MigrationInterface {
  name = "StudentSyncHealthCorrelation1724146300000";
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE student_sync_health ADD COLUMN correlationId varchar(36)");
  }
  async down(): Promise<void> {}
}
