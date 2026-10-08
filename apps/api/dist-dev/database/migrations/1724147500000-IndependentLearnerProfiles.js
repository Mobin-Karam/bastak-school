"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndependentLearnerProfiles1724147500000 = void 0;
class IndependentLearnerProfiles1724147500000 {
    name = "IndependentLearnerProfiles1724147500000";
    async up(queryRunner) {
        await queryRunner.query("ALTER TABLE students ADD COLUMN learnerProfile varchar(24) NOT NULL DEFAULT ('school')");
        await queryRunner.query("ALTER TABLE students ADD COLUMN independentType varchar(32)");
        await queryRunner.query("ALTER TABLE students ADD COLUMN learningLevel varchar(120) NOT NULL DEFAULT ('')");
    }
    async down(queryRunner) {
        await queryRunner.query("ALTER TABLE students DROP COLUMN learningLevel");
        await queryRunner.query("ALTER TABLE students DROP COLUMN independentType");
        await queryRunner.query("ALTER TABLE students DROP COLUMN learnerProfile");
    }
}
exports.IndependentLearnerProfiles1724147500000 = IndependentLearnerProfiles1724147500000;
//# sourceMappingURL=1724147500000-IndependentLearnerProfiles.js.map