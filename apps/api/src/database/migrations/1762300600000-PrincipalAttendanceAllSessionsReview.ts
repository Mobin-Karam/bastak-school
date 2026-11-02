import { MigrationInterface, QueryRunner } from "typeorm";

/** Renames the legacy no-review label to the explicit all-session review policy. */
export class PrincipalAttendanceAllSessionsReview1762300600000 implements MigrationInterface {
  name = "PrincipalAttendanceAllSessionsReview1762300600000";

  async up(queryRunner: QueryRunner) {
    await queryRunner.query(
      "UPDATE attendance_policies SET principalReviewMode='all_sessions' WHERE principalReviewMode='automatic'",
    );
  }

  async down(): Promise<void> {
    /* Keep the explicit review choice; policy changes are operational audit data. */
  }
}
