"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformBootstrap1724145000000 = void 0;
class PlatformBootstrap1724145000000 {
    name = "PlatformBootstrap1724145000000";
    async up(queryRunner) {
        try {
            await queryRunner.query(`ALTER TABLE users ADD COLUMN email varchar(254)`);
        }
        catch (error) {
            if (!String(error).includes("duplicate column"))
                throw error;
        }
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS IDX_users_email ON users(email) WHERE email IS NOT NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS IDX_users_email`);
    }
}
exports.PlatformBootstrap1724145000000 = PlatformBootstrap1724145000000;
//# sourceMappingURL=1724145000000-PlatformBootstrap.js.map