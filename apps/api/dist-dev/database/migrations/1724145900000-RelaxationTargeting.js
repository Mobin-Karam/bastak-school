"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelaxationTargeting1724145900000 = void 0;
class RelaxationTargeting1724145900000 {
    name = "RelaxationTargeting1724145900000";
    async up(q) {
        await q.query("ALTER TABLE relaxation_tracks ADD COLUMN organizationId varchar");
        await q.query("ALTER TABLE relaxation_tracks ADD COLUMN gradeIds text");
        await q.query("ALTER TABLE relaxation_tracks ADD COLUMN availableFrom varchar(10)");
        await q.query("ALTER TABLE relaxation_tracks ADD COLUMN availableUntil varchar(10)");
        await q.query("CREATE INDEX IF NOT EXISTS IDX_relaxation_tracks_organization ON relaxation_tracks(organizationId)");
    }
    async down(q) { await q.query("DROP INDEX IF EXISTS IDX_relaxation_tracks_organization"); }
}
exports.RelaxationTargeting1724145900000 = RelaxationTargeting1724145900000;
//# sourceMappingURL=1724145900000-RelaxationTargeting.js.map