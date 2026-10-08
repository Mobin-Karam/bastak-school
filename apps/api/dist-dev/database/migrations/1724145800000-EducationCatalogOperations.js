"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EducationCatalogOperations1724145800000 = void 0;
class EducationCatalogOperations1724145800000 {
    name = "EducationCatalogOperations1724145800000";
    async up(q) {
        await q.query("ALTER TABLE education_books ADD COLUMN state varchar(16) NOT NULL DEFAULT 'PUBLISHED'");
        await q.query("ALTER TABLE education_books ADD COLUMN version integer NOT NULL DEFAULT 1");
        await q.query("ALTER TABLE education_books ADD COLUMN publishedAt datetime");
        await q.query("ALTER TABLE education_books ADD COLUMN createdAt datetime");
        await q.query("ALTER TABLE education_books ADD COLUMN updatedAt datetime");
        await q.query("UPDATE education_books SET createdAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP WHERE createdAt IS NULL OR updatedAt IS NULL");
        await q.query("CREATE INDEX IF NOT EXISTS IDX_education_books_year_state ON education_books(schoolYear, state)");
        for (const code of ["education.catalog.read", "education.catalog.manage", "education.catalog.publish", "education.operations.read"])
            await q.query("INSERT OR IGNORE INTO permissions(id,code,description) VALUES(lower(hex(randomblob(16))),?,'Education catalog capability')", [code]);
        for (const [role, codes] of Object.entries({ CONTENT_MANAGER: ["education.catalog.read", "education.catalog.manage"], ADVISOR: ["education.catalog.read", "education.operations.read"], TEACHER: ["education.catalog.read", "education.operations.read"], ORGANIZATION_ADMIN: ["education.catalog.read", "education.catalog.manage", "education.catalog.publish", "education.operations.read"], PLATFORM_ADMIN: ["education.catalog.read", "education.catalog.manage", "education.catalog.publish", "education.operations.read"] }))
            for (const code of codes)
                await q.query("INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId) SELECT lower(hex(randomblob(16))),r.id,p.id FROM roles r,permissions p WHERE r.code=? AND p.code=?", [role, code]);
    }
    async down(q) { await q.query("DROP INDEX IF EXISTS IDX_education_books_year_state"); }
}
exports.EducationCatalogOperations1724145800000 = EducationCatalogOperations1724145800000;
//# sourceMappingURL=1724145800000-EducationCatalogOperations.js.map