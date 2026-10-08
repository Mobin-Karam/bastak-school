"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveRequestApprovalRouting1728700000000 = void 0;
class LeaveRequestApprovalRouting1728700000000 {
    name = "LeaveRequestApprovalRouting1728700000000";
    async up(queryRunner) {
        await queryRunner.query("ALTER TABLE leave_requests ADD COLUMN reviewerRole varchar(32) NOT NULL DEFAULT 'PRINCIPAL'");
        await queryRunner.query("CREATE INDEX IDX_leave_org_reviewer_status ON leave_requests(organizationId, reviewerRole, status, createdAt)");
    }
    async down(queryRunner) {
        await queryRunner.query("DROP INDEX IF EXISTS IDX_leave_org_reviewer_status");
    }
}
exports.LeaveRequestApprovalRouting1728700000000 = LeaveRequestApprovalRouting1728700000000;
//# sourceMappingURL=1728700000000-LeaveRequestApprovalRouting.js.map