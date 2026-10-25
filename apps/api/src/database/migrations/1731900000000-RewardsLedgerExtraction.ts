import { MigrationInterface, QueryRunner } from "typeorm";

/** Moves the attendance-owned ledger into a source-neutral, append-only rewards ledger. */
export class RewardsLedgerExtraction1731900000000 implements MigrationInterface {
  name = "RewardsLedgerExtraction1731900000000";
  transaction = false;

  async up(q: QueryRunner): Promise<void> {
    if (q.isTransactionActive) throw new Error("Rewards ledger migration requires its own transaction.");
    await q.query("PRAGMA foreign_keys = OFF");
    try {
      await q.startTransaction();
      await q.query(`CREATE TABLE student_reward_ledger (
        id varchar PRIMARY KEY NOT NULL,
        points integer NOT NULL,
        sourceType varchar(40) NOT NULL,
        sourceId varchar,
        contextType varchar,
        contextId varchar,
        contextName varchar(200),
        requestId varchar,
        reason text NOT NULL,
        createdAt datetime NOT NULL,
        studentId varchar NOT NULL,
        organizationId varchar NOT NULL,
        awardedById varchar,
        reversalOfId varchar,
        CONSTRAINT FK_student_reward_ledger_student FOREIGN KEY(studentId) REFERENCES students(id) ON DELETE CASCADE,
        CONSTRAINT FK_student_reward_ledger_organization FOREIGN KEY(organizationId) REFERENCES organizations(id) ON DELETE CASCADE,
        CONSTRAINT FK_student_reward_ledger_awarded_by FOREIGN KEY(awardedById) REFERENCES users(id) ON DELETE SET NULL,
        CONSTRAINT FK_student_reward_ledger_reversal FOREIGN KEY(reversalOfId) REFERENCES student_reward_ledger(id) ON DELETE RESTRICT
      )`);
      await q.query(`INSERT INTO student_reward_ledger(id,points,sourceType,sourceId,contextType,contextId,contextName,requestId,reason,createdAt,studentId,organizationId,awardedById)
        SELECT ledger.id,ledger.points,
          CASE ledger.source WHEN 'teacher_adjustment' THEN 'manual' ELSE ledger.source END,
          ledger.attendanceRecordId,NULL,NULL,NULL,ledger.requestId,ledger.reason,ledger.createdAt,ledger.studentId,ledger.organizationId,ledger.awardedById
        FROM student_point_ledger ledger`);
      await q.query(`UPDATE student_reward_ledger
        SET contextType=(SELECT session.contextType FROM attendance_records record JOIN attendance_sessions session ON session.id=record.sessionId WHERE record.id=student_reward_ledger.sourceId),
            contextId=(SELECT session.contextId FROM attendance_records record JOIN attendance_sessions session ON session.id=record.sessionId WHERE record.id=student_reward_ledger.sourceId),
            contextName=(SELECT session.titleSnapshot FROM attendance_records record JOIN attendance_sessions session ON session.id=record.sessionId WHERE record.id=student_reward_ledger.sourceId)
        WHERE sourceType='attendance' AND sourceId IS NOT NULL`);
      await q.query("DROP TABLE student_point_ledger");
      await q.query("CREATE INDEX IDX_student_reward_ledger_student_created ON student_reward_ledger(studentId,createdAt,id)");
      await q.query("CREATE INDEX IDX_student_reward_ledger_organization_created ON student_reward_ledger(organizationId,createdAt,id)");
      await q.query("CREATE UNIQUE INDEX UQ_student_reward_ledger_request_scope ON student_reward_ledger(organizationId,awardedById,requestId) WHERE requestId IS NOT NULL AND awardedById IS NOT NULL");
      await q.query("CREATE UNIQUE INDEX UQ_student_reward_ledger_source ON student_reward_ledger(sourceType,sourceId) WHERE sourceId IS NOT NULL AND reversalOfId IS NULL");
      for (const code of ["rewards.self.read", "rewards.read", "rewards.adjust", "rewards.reverse"])
        await q.query("INSERT OR IGNORE INTO permissions(id,code,description) VALUES(lower(hex(randomblob(16))),?,?)", [code, "مدیریت سکه‌های مدرسه"]);
      for (const role of ["STUDENT"])
        await q.query("INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId) SELECT lower(hex(randomblob(16))),r.id,p.id FROM roles r,permissions p WHERE r.code=? AND p.code='rewards.self.read'", [role]);
      for (const role of ["TEACHER", "PRINCIPAL", "SCHOOL_SUPERVISOR", "ORGANIZATION_ADMIN", "PLATFORM_ADMIN"])
        for (const code of ["rewards.read", "rewards.adjust"])
          await q.query("INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId) SELECT lower(hex(randomblob(16))),r.id,p.id FROM roles r,permissions p WHERE r.code=? AND p.code=?", [role, code]);
      for (const role of ["PRINCIPAL", "ORGANIZATION_ADMIN", "PLATFORM_ADMIN"])
        await q.query("INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId) SELECT lower(hex(randomblob(16))),r.id,p.id FROM roles r,permissions p WHERE r.code=? AND p.code='rewards.reverse'", [role]);
      if ((await q.query("PRAGMA foreign_key_check")).length) throw new Error("Rewards ledger migration foreign key check failed.");
      await q.commitTransaction();
    } catch (error) { if (q.isTransactionActive) await q.rollbackTransaction(); throw error; }
    finally { await q.query("PRAGMA foreign_keys = ON"); }
  }
  async down(): Promise<void> { throw new Error("Rewards ledger extraction is forward-only."); }
}
