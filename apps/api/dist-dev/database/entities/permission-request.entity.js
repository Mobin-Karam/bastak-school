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
exports.PermissionRequest = exports.PermissionRequestStatus = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const organization_entity_1 = require("./organization.entity");
const student_entity_1 = require("./student.entity");
const user_entity_1 = require("./user.entity");
var PermissionRequestStatus;
(function (PermissionRequestStatus) {
    PermissionRequestStatus["PENDING"] = "PENDING";
    PermissionRequestStatus["APPROVED"] = "APPROVED";
    PermissionRequestStatus["REJECTED"] = "REJECTED";
})(PermissionRequestStatus || (exports.PermissionRequestStatus = PermissionRequestStatus = {}));
let PermissionRequest = class PermissionRequest {
    id;
    organization;
    student;
    kind;
    title;
    details;
    requestedFor;
    status;
    supervisorNote;
    resolvedBy;
    resolvedAt;
    createdAt;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, organization: { required: true, type: () => require("./organization.entity").Organization }, student: { required: true, type: () => require("./student.entity").Student }, kind: { required: true, type: () => String }, title: { required: true, type: () => String }, details: { required: true, type: () => String }, requestedFor: { required: false, type: () => Date, nullable: true }, status: { required: true, enum: require("./permission-request.entity").PermissionRequestStatus }, supervisorNote: { required: true, type: () => String }, resolvedBy: { required: false, type: () => require("./user.entity").User, nullable: true }, resolvedAt: { required: false, type: () => Date, nullable: true }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.PermissionRequest = PermissionRequest;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], PermissionRequest.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, { onDelete: "CASCADE" }),
    __metadata("design:type", organization_entity_1.Organization)
], PermissionRequest.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { onDelete: "CASCADE" }),
    __metadata("design:type", student_entity_1.Student)
], PermissionRequest.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 80 }),
    __metadata("design:type", String)
], PermissionRequest.prototype, "kind", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 160 }),
    __metadata("design:type", String)
], PermissionRequest.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], PermissionRequest.prototype, "details", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], PermissionRequest.prototype, "requestedFor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 16, default: PermissionRequestStatus.PENDING }),
    __metadata("design:type", String)
], PermissionRequest.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", default: "" }),
    __metadata("design:type", String)
], PermissionRequest.prototype, "supervisorNote", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: "SET NULL" }),
    __metadata("design:type", Object)
], PermissionRequest.prototype, "resolvedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], PermissionRequest.prototype, "resolvedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PermissionRequest.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], PermissionRequest.prototype, "updatedAt", void 0);
exports.PermissionRequest = PermissionRequest = __decorate([
    (0, typeorm_1.Entity)("permission_requests")
], PermissionRequest);
//# sourceMappingURL=permission-request.entity.js.map