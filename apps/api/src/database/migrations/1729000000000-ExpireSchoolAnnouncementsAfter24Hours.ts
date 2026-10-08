import { MigrationInterface, QueryRunner } from "typeorm";

/** Backfills legacy active notices so the read query can consistently expire them. */
export class ExpireSchoolAnnouncementsAfter24Hours1729000000000 implements MigrationInterface {
  name = "ExpireSchoolAnnouncementsAfter24Hours1729000000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE school_announcements
      SET expiresAt = datetime(createdAt, '+24 hours')
      WHERE status = 'ACTIVE' AND expiresAt IS NULL
    `);
  }

  async down(_queryRunner: QueryRunner): Promise<void> {
    // Expiry values are published data; a rollback must not make notices
    // permanent again.
  }
}
