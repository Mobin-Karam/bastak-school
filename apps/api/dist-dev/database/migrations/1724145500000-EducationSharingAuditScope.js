"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EducationSharingAuditScope1724145500000 = void 0;
class EducationSharingAuditScope1724145500000 {
    name = "EducationSharingAuditScope1724145500000";
    async up(queryRunner) {
        await queryRunner.query("ALTER TABLE audit_logs ADD COLUMN organizationId varchar").catch((error) => {
            if (!String(error).includes("duplicate column"))
                throw error;
        });
        await queryRunner.query("CREATE INDEX IF NOT EXISTS IDX_audit_logs_organization ON audit_logs(organizationId)");
    }
    async down(queryRunner) {
        await queryRunner.query("DROP INDEX IF EXISTS IDX_audit_logs_organization");
    }
}
exports.EducationSharingAuditScope1724145500000 = EducationSharingAuditScope1724145500000;
//# sourceMappingURL=1724145500000-EducationSharingAuditScope.js.map