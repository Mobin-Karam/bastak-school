"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhoneNumberAccounts1724147900000 = void 0;
class PhoneNumberAccounts1724147900000 {
    name = "PhoneNumberAccounts1724147900000";
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE users ADD COLUMN phoneNumber varchar(11)`);
        await queryRunner.query(`CREATE UNIQUE INDEX IDX_users_phoneNumber ON users (phoneNumber)`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IDX_users_phoneNumber`);
        await queryRunner.query(`ALTER TABLE users DROP COLUMN phoneNumber`);
    }
}
exports.PhoneNumberAccounts1724147900000 = PhoneNumberAccounts1724147900000;
//# sourceMappingURL=1724147900000-PhoneNumberAccounts.js.map