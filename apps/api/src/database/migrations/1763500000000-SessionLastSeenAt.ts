import { MigrationInterface, QueryRunner } from "typeorm";

export class SessionLastSeenAt1763500000000 implements MigrationInterface {
  name = "SessionLastSeenAt1763500000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    const columns = (await queryRunner.query(
      "PRAGMA table_info(sessions)",
    )) as Array<{ name: string }>;
    if (!columns.some((column) => column.name === "lastSeenAt"))
      await queryRunner.query(
        "ALTER TABLE sessions ADD COLUMN lastSeenAt datetime NULL",
      );
    await queryRunner.query(
      "CREATE INDEX IF NOT EXISTS IDX_sessions_user_last_seen ON sessions(userId,lastSeenAt)",
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP INDEX IF EXISTS IDX_sessions_user_last_seen");
  }
}
