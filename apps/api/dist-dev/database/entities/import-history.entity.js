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
exports.ImportHistory = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const organization_entity_1 = require("./organization.entity");
const user_entity_1 = require("./user.entity");
let ImportHistory = class ImportHistory {
    id;
    actor;
    organization;
    schemaVersion;
    counts;
    result;
    errors;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, actor: { required: true, type: () => require("./user.entity").User }, organization: { required: false, type: () => require("./organization.entity").Organization, nullable: true }, schemaVersion: { required: true, type: () => String }, counts: { required: true, type: "object", additionalProperties: { type: "number" } }, result: { required: true, type: () => String }, errors: { required: false, type: () => [String], nullable: true }, createdAt: { required: true, type: () => Date } };
    }
};
exports.ImportHistory = ImportHistory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], ImportHistory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: "RESTRICT" }),
    __metadata("design:type", user_entity_1.User)
], ImportHistory.prototype, "actor", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, { nullable: true, onDelete: "SET NULL" }),
    __metadata("design:type", Object)
], ImportHistory.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], ImportHistory.prototype, "schemaVersion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-json" }),
    __metadata("design:type", Object)
], ImportHistory.prototype, "counts", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], ImportHistory.prototype, "result", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-json", nullable: true }),
    __metadata("design:type", Object)
], ImportHistory.prototype, "errors", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ImportHistory.prototype, "createdAt", void 0);
exports.ImportHistory = ImportHistory = __decorate([
    (0, typeorm_1.Entity)("import_history")
], ImportHistory);
//# sourceMappingURL=import-history.entity.js.map