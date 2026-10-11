"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationAuthProfiles1730300000000 = void 0;
const typeorm_1 = require("typeorm");
class OrganizationAuthProfiles1730300000000 {
    name = "OrganizationAuthProfiles1730300000000";
    async up(q) {
        await q.addColumn("organizations", new typeorm_1.TableColumn({ name: "authProfile", type: "text", isNullable: true }));
    }
    async down(q) {
        await q.dropColumn("organizations", "authProfile");
    }
}
exports.OrganizationAuthProfiles1730300000000 = OrganizationAuthProfiles1730300000000;
//# sourceMappingURL=1730300000000-OrganizationAuthProfiles.js.map