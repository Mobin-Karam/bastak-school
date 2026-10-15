"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimetableImportSourceRows1731100000000 = void 0;
class TimetableImportSourceRows1731100000000 {
    name = "TimetableImportSourceRows1731100000000";
    async up(q) {
        await q.query(`ALTER TABLE "timetable_imports" ADD COLUMN "sourceRows" text NOT NULL DEFAULT '[]'`);
    }
    async down() {
        throw new Error("Timetable import provenance is forward-only. Roll application code back; preserve the audit schema.");
    }
}
exports.TimetableImportSourceRows1731100000000 = TimetableImportSourceRows1731100000000;
//# sourceMappingURL=1731100000000-TimetableImportSourceRows.js.map