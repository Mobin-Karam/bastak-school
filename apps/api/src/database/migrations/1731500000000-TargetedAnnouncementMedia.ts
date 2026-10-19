import { MigrationInterface, QueryRunner } from "typeorm";

export class TargetedAnnouncementMedia1731500000000 implements MigrationInterface {
  name = "TargetedAnnouncementMedia1731500000000";
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE school_announcements ADD COLUMN category varchar(48) NOT NULL DEFAULT 'general'`,
    );
    await queryRunner.query(
      `ALTER TABLE school_announcements ADD COLUMN linkUrl varchar(2048)`,
    );
    await queryRunner.query(
      `ALTER TABLE school_announcements ADD COLUMN mediaUrl varchar(2048)`,
    );
    await queryRunner.query(
      `ALTER TABLE school_announcements ADD COLUMN mediaType varchar(16)`,
    );
    await queryRunner.query(
      `CREATE TABLE school_announcement_recipients (id varchar PRIMARY KEY NOT NULL, announcementId varchar NOT NULL, userId varchar NOT NULL, CONSTRAINT UQ_school_announcement_recipient UNIQUE (announcementId, userId), FOREIGN KEY (announcementId) REFERENCES school_announcements(id) ON DELETE CASCADE, FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE)`,
    );
    await queryRunner.query(
      `CREATE INDEX IDX_school_announcement_recipient_user ON school_announcement_recipients (userId)`,
    );
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE school_announcement_recipients`);
    // SQLite cannot safely drop these columns without rebuilding populated tables.
  }
}
