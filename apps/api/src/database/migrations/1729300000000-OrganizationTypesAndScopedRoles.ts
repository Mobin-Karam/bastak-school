import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Consolidates legacy tenant labels into the three supported product types and
 * makes personal school roles membership-scoped. Existing assignments are
 * attached to the user's earliest active membership before the role flags are
 * changed, so current school users retain access after migration.
 */
export class OrganizationTypesAndScopedRoles1729300000000 implements MigrationInterface {
  name = "OrganizationTypesAndScopedRoles1729300000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "UPDATE organizations SET type='INSTITUTION' WHERE type IN ('ACADEMY', 'COUNSELING_CENTER')",
    );
    await queryRunner.query(
      "UPDATE organizations SET type='ORGANIZATION' WHERE type IN ('PRIVATE_PRACTICE', 'OTHER')",
    );

    await queryRunner.query(`
      UPDATE user_role_assignments
      SET membershipId = (
        SELECT membership.id
        FROM organization_memberships membership
        WHERE membership.userId = user_role_assignments.userId
          AND membership.status = 'ACTIVE'
        ORDER BY membership.joinedAt ASC, membership.createdAt ASC
        LIMIT 1
      )
      WHERE membershipId IS NULL
        AND roleId IN (SELECT id FROM roles WHERE code IN ('STUDENT', 'GUARDIAN'))
        AND EXISTS (
          SELECT 1
          FROM organization_memberships membership
          WHERE membership.userId = user_role_assignments.userId
            AND membership.status = 'ACTIVE'
        )
    `);
    await queryRunner.query(
      "UPDATE roles SET organizationScoped=1 WHERE code IN ('STUDENT', 'GUARDIAN')",
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    void queryRunner;
    // A legacy ACADEMY and COUNSELING_CENTER both become INSTITUTION, so their
    // original distinction cannot be recovered safely. Prevent a misleading
    // partial rollback; restore a database backup before this migration if a
    // taxonomy rollback is required.
    throw new Error(
      "Organization type consolidation is intentionally irreversible.",
    );
  }
}
