"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepairSingleSchoolOrganizationMemberships1729200000000 = void 0;
class RepairSingleSchoolOrganizationMemberships1729200000000 {
    name = "RepairSingleSchoolOrganizationMemberships1729200000000";
    async up(queryRunner) {
        const soleSchool = `
      SELECT id
      FROM organizations
      WHERE status = 'ACTIVE' AND type = 'SCHOOL'
      AND (SELECT COUNT(*) FROM organizations WHERE status = 'ACTIVE' AND type = 'SCHOOL') = 1
    `;
        await queryRunner.query(`
      UPDATE students
      SET organizationId = (${soleSchool})
      WHERE organizationId IS NULL
        AND userId IS NOT NULL
        AND learnerProfile = 'school'
        AND EXISTS (${soleSchool})
    `);
        await queryRunner.query(`
      INSERT OR IGNORE INTO organization_memberships(
        id, organizationId, userId, status, joinedAt, createdAt, updatedAt
      )
      SELECT lower(hex(randomblob(16))), school.id, candidate.userId,
        'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      FROM (${soleSchool}) school
      JOIN (
        SELECT userId FROM students
        WHERE organizationId = (${soleSchool}) AND userId IS NOT NULL
        UNION
        SELECT assignment.userId
        FROM user_role_assignments assignment
        JOIN roles role ON role.id = assignment.roleId
        WHERE role.organizationScoped = 1 AND assignment.membershipId IS NULL
      ) candidate
      WHERE NOT EXISTS (
        SELECT 1 FROM organization_memberships membership
        WHERE membership.organizationId = school.id AND membership.userId = candidate.userId
      )
    `);
        await queryRunner.query(`
      INSERT OR IGNORE INTO organization_memberships(
        id, organizationId, userId, status, joinedAt, createdAt, updatedAt
      )
      SELECT lower(hex(randomblob(16))), school.id, relation.fromUserId,
        'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      FROM (${soleSchool}) school
      JOIN user_relationships relation
      LEFT JOIN students student ON student.id = relation.toStudentId
      WHERE relation.status = 'ACTIVE'
        AND COALESCE(relation.organizationId, student.organizationId) = school.id
        AND NOT EXISTS (
          SELECT 1 FROM organization_memberships membership
          WHERE membership.organizationId = school.id AND membership.userId = relation.fromUserId
        )
    `);
        await queryRunner.query(`
      UPDATE user_role_assignments
      SET membershipId = (
        SELECT membership.id
        FROM organization_memberships membership
        WHERE membership.userId = user_role_assignments.userId
          AND membership.organizationId = (${soleSchool})
          AND membership.status = 'ACTIVE'
      )
      WHERE membershipId IS NULL
        AND EXISTS (
          SELECT 1 FROM roles role
          WHERE role.id = user_role_assignments.roleId
            AND role.organizationScoped = 1
        )
        AND EXISTS (${soleSchool})
    `);
    }
    async down() {
    }
}
exports.RepairSingleSchoolOrganizationMemberships1729200000000 = RepairSingleSchoolOrganizationMemberships1729200000000;
//# sourceMappingURL=1729200000000-RepairSingleSchoolOrganizationMemberships.js.map