"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RotatingRefreshSessions1724143600000 = void 0;
class RotatingRefreshSessions1724143600000 {
    name = "RotatingRefreshSessions1724143600000";
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE sessions ADD COLUMN refreshTokenHash varchar`);
        await queryRunner.query(`ALTER TABLE sessions ADD COLUMN refreshExpiresAt datetime`);
        await queryRunner.query(`CREATE UNIQUE INDEX IDX_sessions_refresh_token ON sessions(refreshTokenHash)`);
        await queryRunner.query(`CREATE INDEX IDX_sessions_refresh_expiry ON sessions(refreshExpiresAt)`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IDX_sessions_refresh_expiry`);
        await queryRunner.query(`DROP INDEX IDX_sessions_refresh_token`);
        await queryRunner.query(`ALTER TABLE sessions DROP COLUMN refreshExpiresAt`);
        await queryRunner.query(`ALTER TABLE sessions DROP COLUMN refreshTokenHash`);
    }
}
exports.RotatingRefreshSessions1724143600000 = RotatingRefreshSessions1724143600000;
//# sourceMappingURL=1724143600000-RotatingRefreshSessions.js.map