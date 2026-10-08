"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpireSchoolAnnouncementsAfter24Hours1729000000000 = void 0;
class ExpireSchoolAnnouncementsAfter24Hours1729000000000 {
    name = "ExpireSchoolAnnouncementsAfter24Hours1729000000000";
    async up(queryRunner) {
        await queryRunner.query(`
      UPDATE school_announcements
      SET expiresAt = datetime(createdAt, '+24 hours')
      WHERE status = 'ACTIVE' AND expiresAt IS NULL
    `);
    }
    async down(_queryRunner) {
    }
}
exports.ExpireSchoolAnnouncementsAfter24Hours1729000000000 = ExpireSchoolAnnouncementsAfter24Hours1729000000000;
//# sourceMappingURL=1729000000000-ExpireSchoolAnnouncementsAfter24Hours.js.map