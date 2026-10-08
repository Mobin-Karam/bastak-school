import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Some early school accounts were created before the selected organization
 * was persisted on the account.  A missing membership makes role-scoped API
 * checks (and relationships) reject an otherwise valid staff or learner.
 *
 * Only repair records when there is exactly one active school.  In a
 * multi-school database there is no safe organization to infer, so those
 * records remain untouched for an administrator to assign explicitly.
 */
export class RepairSingleSchoolOrganizationMemberships1729200000000
  implements MigrationInterface
{
  name = "RepairSingleSchoolOrganizationMemberships1729200000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    const soleSchool = `
      SELECT id
      FROM organizations
      WHERE status = 'ACTIVE' AND type = 'SCHOOL'
      AND (SELECT COUNT(*) FROM organizations WHERE status = 'ACTIVE' AND type = 'SCHOOL') = 1
    `;

    // A school learner with no primary organization can be safely repaired in
    // a single-school installation.
    await queryRunner.query(`
      UPDATE students
      SET organizationId = (${soleSchool})
      WHERE organizationId IS NULL
        AND userId IS NOT NULL
        AND learnerProfile = 'school'
        AND EXISTS (${soleSchool})
    `);

    // Create active memberships for school students and for legacy scoped
    // staff assignments that had no membership reference.
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

    // A guardian/advisor relationship is an explicit school link.  Keep this
    // limited to the same one-school condition and active links.
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

    // Scoped role assignments must point to the membership that authorizes
    // them.  This repairs legacy rows after the membership has been created.
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

  async down(): Promise<void> {
    // Do not remove memberships created by a repair; they may already be in use.
  }
}
