import { MigrationInterface, QueryRunner } from "typeorm";

/** Additive preference fields; existing users keep notification retention disabled. */
export class NotificationAutoDeletePreferences1763300000000 implements MigrationInterface {
  name = "NotificationAutoDeletePreferences1763300000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    const columns = (await queryRunner.query(
      "PRAGMA table_info(notification_preferences)",
    )) as Array<{ name: string }>;

    if (!columns.some((column) => column.name === "autoDeleteEnabled")) {
      await queryRunner.query(
        "ALTER TABLE notification_preferences ADD COLUMN autoDeleteEnabled boolean NOT NULL DEFAULT (0)",
      );
    }
    if (!columns.some((column) => column.name === "autoDeleteAfterHours")) {
      await queryRunner.query(
        "ALTER TABLE notification_preferences ADD COLUMN autoDeleteAfterHours integer NOT NULL DEFAULT (24)",
      );
    }
  }

  async down(): Promise<void> {
    // SQLite cannot safely drop columns in-place; preserve preference data on rollback.
  }
}
