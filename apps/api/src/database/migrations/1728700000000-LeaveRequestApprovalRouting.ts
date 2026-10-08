import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Makes the student workflow explicit: gate exits are reviewed by the school
 * supervisor, while leave requests are reviewed by the principal. Existing
 * requests remain visible to the principal and default to the leave path.
 */
export class LeaveRequestApprovalRouting1728700000000 implements MigrationInterface {
  name = "LeaveRequestApprovalRouting1728700000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE leave_requests ADD COLUMN reviewerRole varchar(32) NOT NULL DEFAULT 'PRINCIPAL'",
    );
    await queryRunner.query(
      "CREATE INDEX IDX_leave_org_reviewer_status ON leave_requests(organizationId, reviewerRole, status, createdAt)",
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "DROP INDEX IF EXISTS IDX_leave_org_reviewer_status",
    );
    // SQLite cannot safely drop a column without rebuilding this audit table.
  }
}
