import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Repair legacy/imported student accounts that already have a primary school
 * on the student record but were never made active members of that school.
 * It deliberately does not guess an organization for unassigned students.
 */
export class BackfillStudentOrganizationMemberships1728900000000 implements MigrationInterface {
  name = "BackfillStudentOrganizationMemberships1728900000000";

  async up(queryRunner: QueryRunner): Promise<void> {
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

  async down(): Promise<void> {
    // Memberships may have been used after this repair; preserve audit history.
  }
}
