import { MigrationInterface, QueryRunner } from "typeorm";

export class SchoolHomeAudienceAndAccountChanges1728500000000 implements MigrationInterface {
  name = "SchoolHomeAudienceAndAccountChanges1728500000000";

  async up(q: QueryRunner): Promise<void> {
    await q.query(
      "ALTER TABLE users ADD COLUMN phoneNumberChangeCount integer NOT NULL DEFAULT 0",
    );
    await q.query(
      "CREATE TABLE school_prayer_times (id varchar PRIMARY KEY NOT NULL, organizationId varchar NOT NULL, date varchar(10) NOT NULL DEFAULT '', fajr varchar(5) NOT NULL DEFAULT '', sunrise varchar(5) NOT NULL DEFAULT '', dhuhr varchar(5) NOT NULL DEFAULT '', maghrib varchar(5) NOT NULL DEFAULT '', isha varchar(5) NOT NULL DEFAULT '', source varchar(160) NOT NULL DEFAULT '', createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT FK_school_prayer_org FOREIGN KEY(organizationId) REFERENCES organizations(id) ON DELETE CASCADE)",
    );
    await q.query(
      "CREATE UNIQUE INDEX IDX_school_prayer_org_date ON school_prayer_times(organizationId, date)",
    );
    await q.query(
      "CREATE TABLE school_announcements (id varchar PRIMARY KEY NOT NULL, organizationId varchar NOT NULL, audience varchar(16) NOT NULL, classroomId varchar, title varchar(180) NOT NULL, body text NOT NULL, status varchar(16) NOT NULL DEFAULT 'ACTIVE', publishedAt datetime, expiresAt datetime, createdById varchar, createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT FK_school_announcement_org FOREIGN KEY(organizationId) REFERENCES organizations(id) ON DELETE CASCADE, CONSTRAINT FK_school_announcement_class FOREIGN KEY(classroomId) REFERENCES education_classes(id) ON DELETE CASCADE, CONSTRAINT FK_school_announcement_creator FOREIGN KEY(createdById) REFERENCES users(id) ON DELETE SET NULL)",
    );
    await q.query(
      "CREATE INDEX IDX_school_announcement_audience ON school_announcements(organizationId, audience, publishedAt)",
    );
    await q.query(
      "CREATE TABLE account_change_requests (id varchar PRIMARY KEY NOT NULL, organizationId varchar NOT NULL, userId varchar NOT NULL, kind varchar(32) NOT NULL, requestedValue varchar(32) NOT NULL, status varchar(16) NOT NULL DEFAULT 'PENDING', reason text NOT NULL DEFAULT '', reviewNote text NOT NULL DEFAULT '', reviewedById varchar, reviewedAt datetime, createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT FK_account_change_org FOREIGN KEY(organizationId) REFERENCES organizations(id) ON DELETE CASCADE, CONSTRAINT FK_account_change_user FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE, CONSTRAINT FK_account_change_reviewer FOREIGN KEY(reviewedById) REFERENCES users(id) ON DELETE SET NULL)",
    );
    await q.query(
      "CREATE INDEX IDX_account_change_scope ON account_change_requests(organizationId, status)",
    );

    const grants: Record<string, string[]> = {
      STUDENT: ["schedule.read", "prayer_times.read", "announcements.read"],
      GUARDIAN: ["schedule.read", "prayer_times.read", "announcements.read"],
      TEACHER: ["schedule.read", "prayer_times.read", "announcements.read"],
      ADVISOR: ["schedule.read", "prayer_times.read", "announcements.read"],
      MENTOR: ["schedule.read", "prayer_times.read", "announcements.read"],
      CONTENT_MANAGER: [
        "schedule.read",
        "prayer_times.read",
        "announcements.read",
      ],
      COUNSELOR: ["schedule.read", "prayer_times.read", "announcements.read"],
      STUDENT_AFFAIRS_MENTOR: [
        "schedule.read",
        "prayer_times.read",
        "announcements.read",
      ],
      DISCIPLINARIAN: [
        "schedule.read",
        "prayer_times.read",
        "announcements.read",
      ],
      RELIGIOUS_EDUCATION_MANAGER: [
        "schedule.read",
        "prayer_times.read",
        "announcements.read",
      ],
      GOVERNMENT_EDUCATION_MANAGER: [
        "schedule.read",
        "prayer_times.read",
        "announcements.read",
      ],
      PRINCIPAL: [
        "schedule.read",
        "schedule.create",
        "schedule.update",
        "schedule.delete",
        "schedule.archive",
        "schedule.import",
        "schedule.export",
        "prayer_times.read",
        "prayer_times.manage",
        "announcements.read",
        "announcements.manage",
        "account_change_requests.read",
        "account_change_requests.manage",
      ],
      ORGANIZATION_ADMIN: [
        "prayer_times.read",
        "prayer_times.manage",
        "announcements.read",
        "announcements.manage",
        "account_change_requests.read",
        "account_change_requests.manage",
      ],
    };
    for (const capability of new Set(Object.values(grants).flat()))
      await q.query(
        "INSERT OR IGNORE INTO permissions(id,code,description) VALUES(lower(hex(randomblob(16))),?,'School home capability')",
        [capability],
      );
    for (const [role, capabilities] of Object.entries(grants))
      for (const capability of capabilities)
        await q.query(
          "INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId) SELECT lower(hex(randomblob(16))),r.id,p.id FROM roles r,permissions p WHERE r.code=? AND p.code=?",
          [role, capability],
        );
    await q.query(
      "DELETE FROM role_permissions WHERE roleId=(SELECT id FROM roles WHERE code='GUARDIAN') AND permissionId=(SELECT id FROM permissions WHERE code='guardian.encouragement.create')",
    );
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query("DROP TABLE IF EXISTS account_change_requests");
    await q.query("DROP TABLE IF EXISTS school_announcements");
    await q.query("DROP TABLE IF EXISTS school_prayer_times");
    // SQLite cannot drop a column without rebuilding users; retain the audit-safe counter.
  }
}
