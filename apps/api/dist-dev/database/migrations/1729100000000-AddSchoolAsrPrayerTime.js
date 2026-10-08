"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddSchoolAsrPrayerTime1729100000000 = void 0;
class AddSchoolAsrPrayerTime1729100000000 {
    name = "AddSchoolAsrPrayerTime1729100000000";
    async up(queryRunner) {
        await queryRunner.query("ALTER TABLE school_prayer_times ADD COLUMN asr varchar(5) NOT NULL DEFAULT ''");
    }
    async down() {
    }
}
exports.AddSchoolAsrPrayerTime1729100000000 = AddSchoolAsrPrayerTime1729100000000;
//# sourceMappingURL=1729100000000-AddSchoolAsrPrayerTime.js.map