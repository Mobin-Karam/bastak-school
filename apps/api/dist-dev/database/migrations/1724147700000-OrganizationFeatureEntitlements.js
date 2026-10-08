"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationFeatureEntitlements1724147700000 = void 0;
class OrganizationFeatureEntitlements1724147700000 {
    name = "OrganizationFeatureEntitlements1724147700000";
    async up(queryRunner) {
        await queryRunner.query("ALTER TABLE organizations ADD COLUMN disabledFeatures text NOT NULL DEFAULT ('[]')");
    }
    async down(queryRunner) {
        await queryRunner.query("ALTER TABLE organizations DROP COLUMN disabledFeatures");
    }
}
exports.OrganizationFeatureEntitlements1724147700000 = OrganizationFeatureEntitlements1724147700000;
//# sourceMappingURL=1724147700000-OrganizationFeatureEntitlements.js.map