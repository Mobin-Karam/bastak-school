"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityFoundation1724140800000 = void 0;
class SecurityFoundation1724140800000 {
    name = "SecurityFoundation1724140800000";
    async up(q) { await q.query(`CREATE TABLE IF NOT EXISTS login_throttles (id varchar PRIMARY KEY NOT NULL, key varchar(200) NOT NULL, attempts integer NOT NULL DEFAULT 0, windowStartedAt datetime NOT NULL, lockedUntil datetime, updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP)`); await q.query(`CREATE UNIQUE INDEX IF NOT EXISTS IDX_login_throttle_key ON login_throttles(key)`); await q.query(`CREATE INDEX IF NOT EXISTS IDX_login_throttle_lock ON login_throttles(lockedUntil)`); }
    async down(q) { await q.query(`DROP TABLE IF EXISTS login_throttles`); }
}
exports.SecurityFoundation1724140800000 = SecurityFoundation1724140800000;
//# sourceMappingURL=1724140800000-SecurityFoundation.js.map