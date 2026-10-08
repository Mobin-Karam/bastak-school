"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportExport1724141800000 = void 0;
class ImportExport1724141800000 {
    name = "ImportExport1724141800000";
    async up(q) { await q.query(`CREATE TABLE import_history(id varchar PRIMARY KEY NOT NULL,schemaVersion varchar(20) NOT NULL,counts text NOT NULL,result varchar(20) NOT NULL,errors text,createdAt datetime NOT NULL DEFAULT (datetime('now')),actorId varchar NOT NULL,organizationId varchar,CONSTRAINT FK_import_actor FOREIGN KEY(actorId)REFERENCES users(id)ON DELETE RESTRICT,CONSTRAINT FK_import_org FOREIGN KEY(organizationId)REFERENCES organizations(id)ON DELETE SET NULL)`); await q.query(`CREATE INDEX IDX_import_actor_created ON import_history(actorId,createdAt)`); for (const key of ["import.preview", "import.commit", "export.read"])
        await q.query(`INSERT OR IGNORE INTO permissions(id,code,description)VALUES(lower(hex(randomblob(16))),?,'')`, [key]); for (const role of ["ADVISOR", "CONTENT_MANAGER", "ORGANIZATION_ADMIN", "PLATFORM_ADMIN"])
        for (const permission of ["import.preview", "import.commit", "export.read"])
            await q.query(`INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId)SELECT lower(hex(randomblob(16))),r.id,p.id FROM roles r,permissions p WHERE r.code=? AND p.code=?`, [role, permission]); }
    async down(q) { await q.query(`DROP TABLE import_history`); }
}
exports.ImportExport1724141800000 = ImportExport1724141800000;
//# sourceMappingURL=1724141800000-ImportExport.js.map