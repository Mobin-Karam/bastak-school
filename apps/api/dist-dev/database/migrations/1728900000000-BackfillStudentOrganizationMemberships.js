"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackfillStudentOrganizationMemberships1728900000000 = void 0;
class BackfillStudentOrganizationMemberships1728900000000 {
    name = "BackfillStudentOrganizationMemberships1728900000000";
    async up(queryRunner) {
        await queryRunner.query(`
      INSERT OR IGNORE INTO organization_memberships(
        id, organizationId, userId, status, joinedAt, createdAt, updatedAt
      )
      SELECT
        lower(hex(randomblob(16))),
        student.organizationId,
        student.userId,
        'ACTIVE',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      FROM students student
      INNER JOIN organizations organization ON organization.id = student.organizationId
      LEFT JOIN organization_memberships membership
        ON membership.organizationId = student.organizationId
        AND membership.userId = student.userId
      WHERE student.organizationId IS NOT NULL
        AND student.userId IS NOT NULL
        AND organization.status = 'ACTIVE'
        AND membership.id IS NULL
    `);
    }
    async down() {
    }
}
exports.BackfillStudentOrganizationMemberships1728900000000 = BackfillStudentOrganizationMemberships1728900000000;
//# sourceMappingURL=1728900000000-BackfillStudentOrganizationMemberships.js.map