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
exports.RolePermission = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const permission_entity_1 = require("./permission.entity");
const role_entity_1 = require("./role.entity");
let RolePermission = class RolePermission {
    id;
    role;
    permission;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, role: { required: true, type: () => require("./role.entity").Role }, permission: { required: true, type: () => require("./permission.entity").Permission } };
    }
};
exports.RolePermission = RolePermission;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], RolePermission.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => role_entity_1.Role, (role) => role.permissions, { onDelete: "CASCADE" }),
    __metadata("design:type", role_entity_1.Role)
], RolePermission.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => permission_entity_1.Permission, (permission) => permission.roles, { onDelete: "CASCADE" }),
    __metadata("design:type", permission_entity_1.Permission)
], RolePermission.prototype, "permission", void 0);
exports.RolePermission = RolePermission = __decorate([
    (0, typeorm_1.Entity)("role_permissions"),
    (0, typeorm_1.Index)(["role", "permission"], { unique: true })
], RolePermission);
//# sourceMappingURL=role-permission.entity.js.map