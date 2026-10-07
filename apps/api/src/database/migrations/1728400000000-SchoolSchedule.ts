import { MigrationInterface, QueryRunner } from "typeorm";

export class SchoolSchedule1728400000000 implements MigrationInterface {
  name = "SchoolSchedule1728400000000";
  async up(q: QueryRunner) {
    await q.query(`CREATE TABLE school_schedule_entries (id varchar PRIMARY KEY NOT NULL, title varchar(160) NOT NULL, weekday integer NOT NULL, startTime varchar(5) NOT NULL, endTime varchar(5) NOT NULL, room varchar(120) NOT NULL DEFAULT (''), status varchar(20) NOT NULL DEFAULT ('ACTIVE'), createdAt datetime NOT NULL DEFAULT (datetime('now')), updatedAt datetime NOT NULL DEFAULT (datetime('now')), organizationId varchar NOT NULL, classroomId varchar, teacherId varchar, FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE, FOREIGN KEY (classroomId) REFERENCES education_classes(id) ON DELETE SET NULL, FOREIGN KEY (teacherId) REFERENCES users(id) ON DELETE SET NULL)`);
    await q.query(`CREATE INDEX IDX_school_schedule_org_day_time ON school_schedule_entries(organizationId, weekday, startTime)`);
    for (const code of ["schedule.read", "schedule.create", "schedule.update", "schedule.delete", "schedule.archive", "schedule.import", "schedule.export"]) await q.query(`INSERT OR IGNORE INTO permissions(id,code,description) VALUES(lower(hex(randomblob(16))),?,'School schedule capability')`, [code]);
    for (const role of ["ORGANIZATION_ADMIN", "PLATFORM_ADMIN"]) for (const code of ["schedule.read", "schedule.create", "schedule.update", "schedule.delete", "schedule.archive", "schedule.import", "schedule.export"]) await q.query(`INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId) SELECT lower(hex(randomblob(16))),r.id,p.id FROM roles r,permissions p WHERE r.code=? AND p.code=?`, [role, code]);
    for (const role of ["TEACHER", "GUARDIAN"]) await q.query(`INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId) SELECT lower(hex(randomblob(16))),r.id,p.id FROM roles r,permissions p WHERE r.code=? AND p.code='schedule.read'`, [role]);
  }
  async down(q: QueryRunner) { await q.query(`DROP TABLE school_schedule_entries`); }
}
