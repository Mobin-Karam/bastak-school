"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignupThrottle1724143400000 = void 0;
class SignupThrottle1724143400000 {
    name = "SignupThrottle1724143400000";
    async up(q) {
        await q.query(`CREATE TABLE signup_throttles (id varchar PRIMARY KEY NOT NULL, key varchar(80) NOT NULL, attempts integer NOT NULL DEFAULT (0), windowStartedAt datetime NOT NULL, updatedAt datetime NOT NULL DEFAULT (datetime('now')))`);
        await q.query(`CREATE UNIQUE INDEX IDX_signup_throttle_key ON signup_throttles(key)`);
    }
    async down(q) {
        await q.query(`DROP INDEX IDX_signup_throttle_key`);
        await q.query(`DROP TABLE signup_throttles`);
    }
}
exports.SignupThrottle1724143400000 = SignupThrottle1724143400000;
//# sourceMappingURL=1724143400000-SignupThrottle.js.map