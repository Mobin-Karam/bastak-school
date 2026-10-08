"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistrationProgressEnhancements1728236000000 = void 0;
class RegistrationProgressEnhancements1728236000000 {
    name = "RegistrationProgressEnhancements1728236000000";
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE registration_progress ADD COLUMN verifiedById varchar NULL`);
        await queryRunner.query(`ALTER TABLE registration_progress ADD COLUMN verifiedAt datetime NULL`);
        await queryRunner.query(`ALTER TABLE registration_progress ADD COLUMN rejectionNote text NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE registration_progress 
      DROP COLUMN verifiedById,
      DROP COLUMN verifiedAt,
      DROP COLUMN rejectionNote
    `);
    }
}
exports.RegistrationProgressEnhancements1728236000000 = RegistrationProgressEnhancements1728236000000;
//# sourceMappingURL=1728236000000-RegistrationProgressEnhancements.js.map