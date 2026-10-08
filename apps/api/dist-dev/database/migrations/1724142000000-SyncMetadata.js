"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncMetadata1724142000000 = void 0;
class SyncMetadata1724142000000 {
    name = "SyncMetadata1724142000000";
    async up(q) { for (const sql of [`ALTER TABLE plans ADD COLUMN updatedAt datetime`, `ALTER TABLE plans ADD COLUMN deletedAt datetime`, `ALTER TABLE tasks ADD COLUMN createdAt datetime`, `ALTER TABLE tasks ADD COLUMN updatedAt datetime`, `ALTER TABLE tasks ADD COLUMN deletedAt datetime`, `ALTER TABLE exams ADD COLUMN createdAt datetime`, `ALTER TABLE exams ADD COLUMN updatedAt datetime`, `ALTER TABLE exams ADD COLUMN deletedAt datetime`, `ALTER TABLE sync_mutations ADD COLUMN clientMutationId varchar(160)`, `ALTER TABLE sync_mutations ADD COLUMN type varchar(48) NOT NULL DEFAULT ('api_mutation')`])
        await q.query(sql); for (const table of ["plans", "tasks", "exams"])
        await q.query(`UPDATE ${table} SET createdAt=COALESCE(createdAt,datetime('now')),updatedAt=COALESCE(updatedAt,createdAt,datetime('now'))`); await q.query(`UPDATE sync_mutations SET clientMutationId=mutationId WHERE clientMutationId IS NULL`); await q.query(`CREATE UNIQUE INDEX IDX_sync_client_mutation ON sync_mutations(userId,clientMutationId)`); }
    async down() { }
}
exports.SyncMetadata1724142000000 = SyncMetadata1724142000000;
//# sourceMappingURL=1724142000000-SyncMetadata.js.map