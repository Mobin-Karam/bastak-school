"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationTypesAndScopedRoles1729300000000 = void 0;
class OrganizationTypesAndScopedRoles1729300000000 {
    name = "OrganizationTypesAndScopedRoles1729300000000";
    async up(queryRunner) {
        await queryRunner.query("UPDATE organizations SET type='INSTITUTION' WHERE type IN ('ACADEMY', 'COUNSELING_CENTER')");
        await queryRunner.query("UPDATE organizations SET type='ORGANIZATION' WHERE type IN ('PRIVATE_PRACTICE', 'OTHER')");
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
        await queryRunner.query("UPDATE roles SET organizationScoped=1 WHERE code IN ('STUDENT', 'GUARDIAN')");
    }
    async down(queryRunner) {
        void queryRunner;
        throw new Error("Organization type consolidation is intentionally irreversible.");
    }
}
exports.OrganizationTypesAndScopedRoles1729300000000 = OrganizationTypesAndScopedRoles1729300000000;
//# sourceMappingURL=1729300000000-OrganizationTypesAndScopedRoles.js.map