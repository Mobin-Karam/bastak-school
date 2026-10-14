"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimetableImportIdempotency1731000000000 = void 0;
const typeorm_1 = require("typeorm");
class TimetableImportIdempotency1731000000000 {
    name = "TimetableImportIdempotency1731000000000";
    async up(q) {
        await q.query(`ALTER TABLE "timetable_imports" ADD COLUMN "fingerprint" varchar(64) NOT NULL DEFAULT ''`);
        await q.query(`UPDATE "timetable_imports" SET "fingerprint" = 'legacy-' || "id" WHERE "fingerprint" = ''`);
        await q.createIndex("timetable_imports", new typeorm_1.TableIndex({
            name: "UQ_timetable_import_version_fingerprint",
            columnNames: ["versionId", "fingerprint"],
            isUnique: true,
        }));
    }
    async down() {
        throw new Error("Timetable import provenance is forward-only. Roll application code back; preserve the replay-safe schema.");
    }
}
exports.TimetableImportIdempotency1731000000000 = TimetableImportIdempotency1731000000000;
//# sourceMappingURL=1731000000000-TimetableImportIdempotency.js.map