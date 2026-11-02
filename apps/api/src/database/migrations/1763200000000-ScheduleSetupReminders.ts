import { MigrationInterface, QueryRunner } from "typeorm";

/** Schema-only: existing schedule and attendance rows are not modified. */
export class ScheduleSetupReminders1763200000000 implements MigrationInterface {
  name = "ScheduleSetupReminders1763200000000";
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS schedule_setup_reminders (id varchar PRIMARY KEY NOT NULL, dueAt datetime NOT NULL, status varchar(16) NOT NULL DEFAULT ('scheduled'), deliveredAt datetime, createdAt datetime NOT NULL DEFAULT (datetime('now')), updatedAt datetime NOT NULL DEFAULT (datetime('now')), organizationId varchar NOT NULL, requestedById varchar NOT NULL, CONSTRAINT FK_schedule_setup_reminder_org FOREIGN KEY (organizationId) REFERENCES organizations (id) ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT FK_schedule_setup_reminder_user FOREIGN KEY (requestedById) REFERENCES users (id) ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_schedule_setup_reminder_actor_org ON schedule_setup_reminders (organizationId, requestedById, status)`,
    );
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS schedule_setup_reminders");
  }
}
