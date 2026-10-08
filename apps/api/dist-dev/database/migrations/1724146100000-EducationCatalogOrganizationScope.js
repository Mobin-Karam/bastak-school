"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EducationCatalogOrganizationScope1724146100000 = void 0;
class EducationCatalogOrganizationScope1724146100000 {
    name = "EducationCatalogOrganizationScope1724146100000";
    async up(q) { await q.query("ALTER TABLE education_books ADD COLUMN organizationId varchar"); await q.query("CREATE INDEX IF NOT EXISTS IDX_education_books_organization ON education_books(organizationId)"); }
    async down(q) { await q.query("DROP INDEX IF EXISTS IDX_education_books_organization"); }
}
exports.EducationCatalogOrganizationScope1724146100000 = EducationCatalogOrganizationScope1724146100000;
//# sourceMappingURL=1724146100000-EducationCatalogOrganizationScope.js.map