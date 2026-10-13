import { MigrationInterface, QueryRunner } from "typeorm";

/** Additive only. Ambiguous legacy facts stop the upgrade; no record is repaired or removed. */
export class PersistenceUniquenessAndReadIndexes1730800000000 implements MigrationInterface {
  name = "PersistenceUniquenessAndReadIndexes1730800000000";

  async up(q: QueryRunner): Promise<void> {
    if ((await q.query("PRAGMA foreign_key_check")).length)
      throw new Error("Persistence preflight failed: broken foreign references. Preserve records and resolve integrity explicitly before retrying.");
    const conflicts = [
      ["attendance pairs", "SELECT 1 FROM attendance_records GROUP BY sessionId,studentId HAVING count(*)>1 LIMIT 1"],
      ["current dorm placements", "SELECT 1 FROM dorm_room_assignments GROUP BY studentId HAVING count(*)>1 LIMIT 1"],
      ["presence task pointers", "SELECT 1 FROM student_presence WHERE currentTaskId IS NOT NULL GROUP BY currentTaskId HAVING count(*)>1 LIMIT 1"],
      ["dorm school ownership", `SELECT 1 FROM dorm_room_assignments a
        JOIN dorm_rooms r ON r.id=a.roomId JOIN students s ON s.id=a.studentId
        WHERE s.organizationId IS NULL OR s.organizationId<>r.organizationId LIMIT 1`],
    ];
    for (const [kind, query] of conflicts) {
      if ((await q.query(query)).length)
        throw new Error(`Persistence preflight failed: conflicting ${kind}. Preserve records and resolve ownership explicitly before retrying.`);
    }
    await q.query("CREATE UNIQUE INDEX UQ_attendance_record_session_student ON attendance_records(sessionId,studentId)");
    await q.query("CREATE UNIQUE INDEX UQ_dorm_assignment_student ON dorm_room_assignments(studentId)");
    await q.query("CREATE UNIQUE INDEX UQ_presence_current_task ON student_presence(currentTaskId) WHERE currentTaskId IS NOT NULL");
    await q.query("CREATE INDEX IDX_attendance_record_student_created ON attendance_records(studentId,createdAt,id)");
    // The NightAttendance table rebuild removed the original organization/date index.
    await q.query("CREATE INDEX IDX_attendance_session_org_date_id ON attendance_sessions(organizationId,sessionDate,id)");
    for (const event of ["INSERT", "UPDATE"] as const) {
      await q.query(`CREATE TRIGGER dorm_assignment_scope_${event.toLowerCase()} BEFORE ${event} ON dorm_room_assignments
        WHEN NOT EXISTS (SELECT 1 FROM dorm_rooms r JOIN students s ON s.id=NEW.studentId
          WHERE r.id=NEW.roomId AND s.organizationId=r.organizationId)
        BEGIN SELECT RAISE(ABORT, 'DORM_STUDENT_ORGANIZATION_MISMATCH'); END`);
    }
  }

  async down(q: QueryRunner): Promise<void> {
    // No table rebuilds/data deletion. Drain writers before removing uniqueness guarantees.
    for (const event of ["insert", "update"])
      await q.query(`DROP TRIGGER dorm_assignment_scope_${event}`);
    for (const index of ["IDX_attendance_session_org_date_id", "IDX_attendance_record_student_created", "UQ_presence_current_task", "UQ_dorm_assignment_student", "UQ_attendance_record_session_student"])
      await q.query(`DROP INDEX ${index}`);
  }
}
