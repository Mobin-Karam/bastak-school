"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CmbRuntimeService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const cmb_activity_1 = require("@moshaver/cmb-activity");
const cmb_auth_1 = require("@moshaver/cmb-auth");
const cmb_authorization_1 = require("@moshaver/cmb-authorization");
const cmb_data_transfer_1 = require("@moshaver/cmb-data-transfer");
const cmb_health_1 = require("@moshaver/cmb-health");
const cmb_identity_1 = require("@moshaver/cmb-identity");
const cmb_infrastructure_1 = require("@moshaver/cmb-infrastructure");
const cmb_kernel_1 = require("@moshaver/cmb-kernel");
const cmb_notifications_1 = require("@moshaver/cmb-notifications");
const cmb_persistence_1 = require("@moshaver/cmb-persistence");
const cmb_realtime_1 = require("@moshaver/cmb-realtime");
const cmb_system_1 = require("@moshaver/cmb-system");
const cmb_tenancy_1 = require("@moshaver/cmb-tenancy");
let CmbRuntimeService = class CmbRuntimeService {
    modules = new cmb_kernel_1.CmbModuleRegistry([
        cmb_health_1.HEALTH_MODULE,
        cmb_infrastructure_1.INFRASTRUCTURE_MODULE,
        cmb_persistence_1.PERSISTENCE_MODULE,
        cmb_identity_1.IDENTITY_MODULE,
        cmb_tenancy_1.TENANCY_MODULE,
        cmb_auth_1.AUTH_MODULE,
        cmb_authorization_1.AUTHORIZATION_MODULE,
        cmb_system_1.SYSTEM_MODULE,
        cmb_realtime_1.REALTIME_MODULE,
        cmb_notifications_1.NOTIFICATIONS_MODULE,
        cmb_activity_1.ACTIVITY_MODULE,
        cmb_data_transfer_1.DATA_TRANSFER_MODULE,
    ]);
    adapters;
    constructor(dataSource) {
        this.modules.resolve();
        this.adapters = new cmb_infrastructure_1.CmbAdapterRegistry([
            {
                port: "persistence.database",
                id: "typeorm-sqlite",
                required: true,
                ready: async () => {
                    await dataSource.query("SELECT 1 AS ready");
                },
            },
            { port: "realtime.transport", id: "in-process-sse", required: false },
            { port: "notifications.delivery", id: "web-push", required: false },
        ]);
    }
    moduleInventory() {
        return this.modules.metadata();
    }
    adapterInventory() {
        return this.adapters.inventory();
    }
    readinessProbes() {
        return [
            { name: "modules", check: async () => void this.modules.resolve() },
            ...this.adapters
                .readinessProbes()
                .map((probe) => ({
                ...probe,
                name: probe.name === "adapter:persistence.database"
                    ? "database"
                    : probe.name,
            })),
        ];
    }
};
exports.CmbRuntimeService = CmbRuntimeService;
exports.CmbRuntimeService = CmbRuntimeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], CmbRuntimeService);
//# sourceMappingURL=cmb-runtime.service.js.map