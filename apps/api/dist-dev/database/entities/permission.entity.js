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
exports.Permission = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const role_permission_entity_1 = require("./role-permission.entity");
let Permission = class Permission {
    id;
    code;
    description;
    roles;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, code: { required: true, type: () => String }, description: { required: true, type: () => String }, roles: { required: true, type: () => [require("./role-permission.entity").RolePermission] } };
    }
};
exports.Permission = Permission;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Permission.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)({ unique: true }),
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Permission.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 180, default: "" }),
    __metadata("design:type", String)
], Permission.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => role_permission_entity_1.RolePermission, (item) => item.permission),
    __metadata("design:type", Array)
], Permission.prototype, "roles", void 0);
exports.Permission = Permission = __decorate([
    (0, typeorm_1.Entity)("permissions")
], Permission);
//# sourceMappingURL=permission.entity.js.map