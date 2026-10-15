"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseRelationshipIntegrity1730700000000 = void 0;
const foreignKeys = [
    ["conversations", "organizationId", "organizations", "CASCADE"],
    ["chat_messages", "linkedTaskId", "tasks", "SET NULL"],
    [
        "school_schedule_entries",
        "classBookId",
        "education_class_books",
        "SET NULL",
    ],
    ["attendance_records", "reviewedById", "users", "SET NULL"],
    ["exit_permissions", "returnVerifiedById", "users", "SET NULL"],
];
class DatabaseRelationshipIntegrity1730700000000 {
    name = "DatabaseRelationshipIntegrity1730700000000";
    transaction = false;
    async up(q) {
        if (q.isTransactionActive)
            throw new Error("Relationship integrity migration requires migrationsTransactionMode=each.");
        const enforcement = Number((await q.query("PRAGMA foreign_keys"))[0].foreign_keys);
        const legacy = Number((await q.query("PRAGMA legacy_alter_table"))[0].legacy_alter_table);
        await q.query("PRAGMA foreign_keys = OFF");
        await q.query("PRAGMA legacy_alter_table = ON");
        try {
            await q.startTransaction();
            await q.query(`DELETE FROM user_role_assignments
        WHERE membershipId IS NULL
          AND roleId IN (SELECT id FROM roles WHERE organizationScoped=1)`);
            await this.preflight(q);
            await q.query(`INSERT INTO students(id,userId,organizationId,name)
        SELECT lower(hex(randomblob(16))),u.id,m.organizationId,
          CASE WHEN trim(u.firstName || ' ' || u.lastName)<>'' THEN trim(u.firstName || ' ' || u.lastName) ELSE u.username END
        FROM users u JOIN user_role_assignments a ON a.userId=u.id
        JOIN roles r ON r.id=a.roleId AND r.code='STUDENT'
        JOIN organization_memberships m ON m.id=a.membershipId AND m.userId=u.id
        WHERE NOT EXISTS (SELECT 1 FROM students s WHERE s.userId=u.id)
        GROUP BY u.id`);
            await q.query(`DELETE FROM user_role_assignments WHERE membershipId IS NULL AND id IN (
        SELECT id FROM (SELECT id, ROW_NUMBER() OVER (PARTITION BY userId, roleId ORDER BY createdAt, id) AS ordinal
        FROM user_role_assignments WHERE membershipId IS NULL) WHERE ordinal > 1)`);
            await q.query(`DELETE FROM user_relationships WHERE organizationId IS NULL AND id IN (
        SELECT id FROM (SELECT id, ROW_NUMBER() OVER (PARTITION BY fromUserId, toStudentId, type ORDER BY createdAt, id) AS ordinal
        FROM user_relationships WHERE organizationId IS NULL) WHERE ordinal > 1)`);
            for (const [table, column, parent, onDelete] of foreignKeys) {
                await q.query(`UPDATE "${table}" SET "${column}"=NULL WHERE "${column}" IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM "${parent}" WHERE id="${table}"."${column}")`);
                await this.rebuildTable(q, table, column, parent, onDelete);
            }
            for (const [table, columns] of [
                ["tasks", ["createdAt", "updatedAt"]],
                ["plans", ["updatedAt"]],
                ["exams", ["createdAt", "updatedAt"]],
                ["education_books", ["createdAt", "updatedAt"]],
            ]) {
                for (const column of columns)
                    await q.query(`UPDATE "${table}" SET "${column}"=CURRENT_TIMESTAMP WHERE "${column}" IS NULL`);
                await this.rebuildTable(q, table, undefined, undefined, undefined, [
                    ...columns,
                ]);
            }
            await q.query("UPDATE sync_mutations SET clientMutationId=mutationId WHERE clientMutationId IS NULL");
            await this.rebuildTable(q, "sync_mutations", undefined, undefined, undefined, ["clientMutationId"]);
            await q.query("DROP TRIGGER IF EXISTS FK_organization_chat_cleanup");
            await q.query("CREATE UNIQUE INDEX IF NOT EXISTS UQ_students_user ON students(userId) WHERE userId IS NOT NULL");
            await q.query("CREATE UNIQUE INDEX IF NOT EXISTS UQ_assignment_global ON user_role_assignments(userId,roleId) WHERE membershipId IS NULL");
            await q.query("CREATE UNIQUE INDEX IF NOT EXISTS UQ_relationship_global ON user_relationships(fromUserId,toStudentId,type) WHERE organizationId IS NULL");
            for (const event of ["INSERT", "UPDATE"]) {
                await q.query(`CREATE TRIGGER IF NOT EXISTS assignment_scope_${event.toLowerCase()} BEFORE ${event} ON user_role_assignments
          WHEN NOT EXISTS (SELECT 1 FROM roles r WHERE r.id=NEW.roleId AND (
            (r.organizationScoped=0 AND NEW.membershipId IS NULL) OR
            (r.organizationScoped=1 AND EXISTS (SELECT 1 FROM organization_memberships m WHERE m.id=NEW.membershipId AND m.userId=NEW.userId))
          )) BEGIN SELECT RAISE(ABORT, 'ROLE_ASSIGNMENT_SCOPE_INVALID'); END`);
            }
            await q.query(`CREATE TRIGGER IF NOT EXISTS membership_assignment_owner_update BEFORE UPDATE OF userId ON organization_memberships
        WHEN EXISTS (SELECT 1 FROM user_role_assignments a WHERE a.membershipId=OLD.id AND a.userId<>NEW.userId)
        BEGIN SELECT RAISE(ABORT, 'ROLE_ASSIGNMENT_OWNER_INVALID'); END`);
            await q.query(`CREATE TRIGGER IF NOT EXISTS role_assignment_scope_update BEFORE UPDATE OF organizationScoped ON roles
        WHEN EXISTS (SELECT 1 FROM user_role_assignments a WHERE a.roleId=OLD.id AND
          ((NEW.organizationScoped=1 AND a.membershipId IS NULL) OR (NEW.organizationScoped=0 AND a.membershipId IS NOT NULL)))
        BEGIN SELECT RAISE(ABORT, 'ROLE_ASSIGNMENT_SCOPE_INVALID'); END`);
            if ((await q.query("PRAGMA foreign_key_check")).length)
                throw new Error("Foreign key violations remain; integrity migration rolled back. Repair existing data before retrying.");
            await q.commitTransaction();
        }
        catch (error) {
            if (q.isTransactionActive)
                await q.rollbackTransaction();
            throw error;
        }
        finally {
            await q.query(`PRAGMA legacy_alter_table = ${legacy}`);
            await q.query(`PRAGMA foreign_keys = ${enforcement}`);
        }
    }
    async preflight(q) {
        if ((await q.query(`SELECT 1 FROM user_role_assignments a
      JOIN roles r ON r.id=a.roleId AND r.code='STUDENT'
      JOIN organization_memberships m ON m.id=a.membershipId AND m.userId=a.userId
      WHERE NOT EXISTS (SELECT 1 FROM students s WHERE s.userId=a.userId)
      GROUP BY a.userId HAVING count(DISTINCT m.organizationId)>1 LIMIT 1`)).length)
            throw new Error("Missing student profiles with multiple school assignments require explicit ownership resolution before migration.");
        if ((await q.query("SELECT 1 FROM students WHERE userId IS NOT NULL GROUP BY userId HAVING count(*)>1 LIMIT 1")).length)
            throw new Error("Duplicate students.userId links require explicit resolution before migration; no student records were changed.");
        if ((await q.query(`SELECT 1 FROM user_role_assignments a JOIN roles r ON r.id=a.roleId
      LEFT JOIN organization_memberships m ON m.id=a.membershipId
      WHERE (a.membershipId IS NOT NULL AND (m.id IS NULL OR m.userId<>a.userId))
        OR (r.organizationScoped=1 AND a.membershipId IS NULL)
        OR (r.organizationScoped=0 AND a.membershipId IS NOT NULL) LIMIT 1`)).length)
            throw new Error("Invalid role assignment ownership/scope requires explicit resolution before migration; no assignments were changed.");
        if ((await q.query(`SELECT 1 FROM user_relationships WHERE organizationId IS NULL
      GROUP BY fromUserId,toStudentId,type HAVING count(DISTINCT status)>1 LIMIT 1`)).length)
            throw new Error("Conflicting duplicate personal relationships require explicit resolution before migration; no relationship decisions were changed.");
    }
    async rebuildTable(q, table, column, parent, onDelete, requiredColumns = []) {
        if (!column && requiredColumns.length) {
            const schema = await q.query(`PRAGMA table_info("${table}")`);
            if (requiredColumns.every((name) => schema.some((c) => c.name === name && c.notnull)))
                return;
        }
        const existing = await q.query(`PRAGMA foreign_key_list("${table}")`);
        if (column &&
            existing.some((key) => key.from === column && key.table === parent))
            return;
        const [{ sql }] = await q.query("SELECT sql FROM sqlite_master WHERE type='table' AND name=?", [table]);
        const objects = await q.query("SELECT sql FROM sqlite_master WHERE tbl_name=? AND type IN ('index','trigger') AND sql IS NOT NULL", [table]);
        const columns = await q.query(`PRAGMA table_xinfo("${table}")`);
        const names = columns
            .filter((c) => !c.hidden)
            .map((c) => `"${c.name.replace(/"/g, '""')}"`)
            .join(",");
        const temporary = `integrity_${table}`;
        let ddl = sql.replace(/^CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(?:"[^"]+"|`[^`]+`|\[[^\]]+\]|\w+)/i, `CREATE TABLE "${temporary}"`);
        for (const required of requiredColumns) {
            ddl = ddl.replace(new RegExp(`("?${required}"?\\s+(?:datetime|varchar\\(160\\)))(?!\\s+NOT NULL)`, "i"), "$1 NOT NULL");
        }
        const end = ddl.lastIndexOf(")");
        if (column)
            await q.query(`${ddl.slice(0, end)}, CONSTRAINT "FK_integrity_${table}_${column}" FOREIGN KEY ("${column}") REFERENCES "${parent}"(id) ON DELETE ${onDelete}${ddl.slice(end)}`);
        else
            await q.query(ddl);
        await q.query(`INSERT INTO "${temporary}" (${names}) SELECT ${names} FROM "${table}"`);
        await q.query(`DROP TABLE "${table}"`);
        await q.query(`ALTER TABLE "${temporary}" RENAME TO "${table}"`);
        for (const object of objects)
            await q.query(object.sql);
    }
    async down() {
        throw new Error("Relationship integrity repairs are forward-only. Restore a pre-migration backup to undo data repairs.");
    }
}
exports.DatabaseRelationshipIntegrity1730700000000 = DatabaseRelationshipIntegrity1730700000000;
//# sourceMappingURL=1730700000000-DatabaseRelationshipIntegrity.js.map