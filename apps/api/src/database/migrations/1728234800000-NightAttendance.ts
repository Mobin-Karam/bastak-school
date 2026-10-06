import { MigrationInterface, QueryRunner } from "typeorm";

export class NightAttendance1728234800000 implements MigrationInterface {
  name = "NightAttendance1728234800000";

  async up(queryRunner: QueryRunner): Promise<void> {
    // Update the contextType column to allow 'night' value
    // SQLite doesn't support ALTER COLUMN TYPE, so we need to recreate the column
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS attendance_sessions_new (
        id varchar PRIMARY KEY NOT NULL,
        organizationId varchar NOT NULL,
        contextType varchar(24) NOT NULL,
        contextId varchar(120) NOT NULL,
        sessionDate datetime NOT NULL,
        note text NOT NULL DEFAULT '',
        createdById varchar,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT FK_attendance_session_org
          FOREIGN KEY(organizationId)
          REFERENCES organizations(id)
          ON DELETE CASCADE,

        CONSTRAINT FK_attendance_session_created_by
          FOREIGN KEY(createdById)
          REFERENCES users(id)
          ON DELETE SET NULL
      )
    `);

    // Copy existing data
    await queryRunner.query(`
      INSERT INTO attendance_sessions_new 
      SELECT id, organizationId, contextType, contextId, sessionDate, note, createdById, createdAt, updatedAt 
      FROM attendance_sessions
    `);

    // Drop old table and rename new one
    await queryRunner.query(`DROP TABLE attendance_sessions`);
    await queryRunner.query(`ALTER TABLE attendance_sessions_new RENAME TO attendance_sessions`);

    // Recreate indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_attendance_sessions_organization
      ON attendance_sessions(organizationId)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_attendance_sessions_context
      ON attendance_sessions(contextType, contextId)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Revert to original structure
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS attendance_sessions_original (
        id varchar PRIMARY KEY NOT NULL,
        organizationId varchar NOT NULL,
        contextType varchar(24) NOT NULL,
        contextId varchar(120) NOT NULL,
        sessionDate datetime NOT NULL,
        note text NOT NULL DEFAULT '',
        createdById varchar,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT FK_attendance_session_org
          FOREIGN KEY(organizationId)
          REFERENCES organizations(id)
          ON DELETE CASCADE,

        CONSTRAINT FK_attendance_session_created_by
          FOREIGN KEY(createdById)
          REFERENCES users(id)
          ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      INSERT INTO attendance_sessions_original 
      SELECT id, organizationId, contextType, contextId, sessionDate, note, createdById, createdAt, updatedAt 
      FROM attendance_sessions
      WHERE contextType IN ('class', 'class_group', 'study_group', 'dorm')
    `);

    await queryRunner.query(`DROP TABLE attendance_sessions`);
    await queryRunner.query(`ALTER TABLE attendance_sessions_original RENAME TO attendance_sessions`);
  }
}
