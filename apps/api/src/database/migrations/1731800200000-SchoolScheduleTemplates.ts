import { MigrationInterface, QueryRunner } from "typeorm";
export class SchoolScheduleTemplates1731800200000 implements MigrationInterface {
  name = "SchoolScheduleTemplates1731800200000";
  async up(q: QueryRunner) {
    await q.query(
      'CREATE TABLE "school_schedule_templates" ("id" varchar(36) PRIMARY KEY NOT NULL, "organizationId" varchar(36) NOT NULL, "name" varchar(120) NOT NULL, "state" varchar(20) NOT NULL DEFAULT \'ACTIVE\', "entries" text NOT NULL DEFAULT \'[]\', "createdAt" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE)',
    );
    await q.query(
      'CREATE INDEX "IDX_schedule_template_organization_state" ON "school_schedule_templates" ("organizationId", "state")',
    );
  }
  async down(): Promise<void> {}
}
