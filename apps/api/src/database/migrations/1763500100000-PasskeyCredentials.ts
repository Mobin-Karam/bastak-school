import { MigrationInterface, QueryRunner } from "typeorm";

/** Adds public-key credentials only. Existing account and session rows are untouched. */
export class PasskeyCredentials1763500100000 implements MigrationInterface {
  name = "PasskeyCredentials1763500100000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS passkey_credentials (
      id varchar PRIMARY KEY NOT NULL, userId varchar NOT NULL, credentialId varchar(1024) NOT NULL,
      publicKey text NOT NULL, counter integer NOT NULL DEFAULT (0), transports text,
      deviceType varchar(32), backedUp boolean NOT NULL DEFAULT (0), lastUsedAt datetime,
      createdAt datetime NOT NULL DEFAULT (datetime('now')),
      CONSTRAINT FK_passkey_credentials_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )`);
    await queryRunner.query(
      "CREATE UNIQUE INDEX IF NOT EXISTS IDX_passkey_credentials_credential ON passkey_credentials(credentialId)",
    );
    await queryRunner.query(
      "CREATE INDEX IF NOT EXISTS IDX_passkey_credentials_user_created ON passkey_credentials(userId, createdAt)",
    );
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS webauthn_challenges (
      id varchar PRIMARY KEY NOT NULL, userId varchar, purpose varchar(24) NOT NULL, challenge varchar(1024) NOT NULL,
      origin varchar(255) NOT NULL, rpId varchar(255) NOT NULL, expiresAt datetime NOT NULL,
      createdAt datetime NOT NULL DEFAULT (datetime('now')),
      CONSTRAINT FK_webauthn_challenges_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )`);
    await queryRunner.query(
      "CREATE INDEX IF NOT EXISTS IDX_webauthn_challenges_expires ON webauthn_challenges(expiresAt)",
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS webauthn_challenges");
    await queryRunner.query("DROP TABLE IF EXISTS passkey_credentials");
  }
}
