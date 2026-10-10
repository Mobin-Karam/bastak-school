"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleClassBooks1729800000000 = void 0;
class ScheduleClassBooks1729800000000 {
    name = "ScheduleClassBooks1729800000000";
    async up(queryRunner) {
        await queryRunner.query("ALTER TABLE school_schedule_entries ADD COLUMN classBookId varchar");
        await queryRunner.query("CREATE INDEX IDX_schedule_class_book ON school_schedule_entries(classBookId)");
    }
    async down(queryRunner) {
        await queryRunner.query("DROP INDEX IDX_schedule_class_book");
        await queryRunner.query("ALTER TABLE school_schedule_entries DROP COLUMN classBookId");
    }
}
exports.ScheduleClassBooks1729800000000 = ScheduleClassBooks1729800000000;
//# sourceMappingURL=1729800000000-ScheduleClassBooks.js.map