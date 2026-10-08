"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExitReturnVerificationAndOccupancy1729500000000 = void 0;
class ExitReturnVerificationAndOccupancy1729500000000 {
    name = "ExitReturnVerificationAndOccupancy1729500000000";
    async up(queryRunner) {
        await queryRunner.query("ALTER TABLE exit_permissions ADD COLUMN returnRequestedAt datetime");
        await queryRunner.query("ALTER TABLE exit_permissions ADD COLUMN returnRequestNote text NOT NULL DEFAULT ''");
        await queryRunner.query("ALTER TABLE exit_permissions ADD COLUMN returnVerifiedById varchar");
        await queryRunner.query("ALTER TABLE exit_permissions ADD COLUMN returnVerifiedAt datetime");
        await queryRunner.query("CREATE INDEX IF NOT EXISTS IDX_exit_occupancy ON exit_permissions(organizationId, status, actualDepartureAt, actualReturnAt)");
        const roles = [
            "PLATFORM_ADMIN",
            "ORGANIZATION_ADMIN",
            "PRINCIPAL",
            "SCHOOL_ADMIN",
            "SCHOOL_SUPERVISOR",
            "DISCIPLINARIAN",
            "RELIGIOUS_EDUCATION_MANAGER",
            "GOVERNMENT_EDUCATION_MANAGER",
            "STUDENT_AFFAIRS_MENTOR",
            "COUNSELOR",
            "ADVISOR",
            "MENTOR",
            "CONTENT_MANAGER",
        ];
        await queryRunner.query("INSERT OR IGNORE INTO permissions(id,code,description) VALUES(lower(hex(randomblob(16))),'school.occupancy.read','Read the live count of students currently in school')");
        for (const role of roles) {
            await queryRunner.query("INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId) SELECT lower(hex(randomblob(16))),r.id,p.id FROM roles r,permissions p WHERE r.code=? AND p.code='school.occupancy.read'", [role]);
        }
    }
    async down() {
    }
}
exports.ExitReturnVerificationAndOccupancy1729500000000 = ExitReturnVerificationAndOccupancy1729500000000;
//# sourceMappingURL=1729500000000-ExitReturnVerificationAndOccupancy.js.map