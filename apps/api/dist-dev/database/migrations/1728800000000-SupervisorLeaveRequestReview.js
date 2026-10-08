"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupervisorLeaveRequestReview1728800000000 = void 0;
class SupervisorLeaveRequestReview1728800000000 {
    name = "SupervisorLeaveRequestReview1728800000000";
    async up(queryRunner) {
        for (const capability of ["leave.read", "leave.manage"]) {
            await queryRunner.query("INSERT OR IGNORE INTO permissions(id,code,description) VALUES(lower(hex(randomblob(16))),?,'Supervisor leave-review capability')", [capability]);
            await queryRunner.query("INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId) SELECT lower(hex(randomblob(16))),r.id,p.id FROM roles r,permissions p WHERE r.code='SCHOOL_SUPERVISOR' AND p.code=?", [capability]);
        }
    }
    async down() {
    }
}
exports.SupervisorLeaveRequestReview1728800000000 = SupervisorLeaveRequestReview1728800000000;
//# sourceMappingURL=1728800000000-SupervisorLeaveRequestReview.js.map