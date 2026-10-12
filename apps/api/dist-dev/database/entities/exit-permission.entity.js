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
exports.ExitPermission = exports.ExitPermissionStatus = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const organization_entity_1 = require("./organization.entity");
const student_entity_1 = require("./student.entity");
const user_entity_1 = require("./user.entity");
var ExitPermissionStatus;
(function (ExitPermissionStatus) {
    ExitPermissionStatus["PENDING"] = "PENDING";
    ExitPermissionStatus["APPROVED"] = "APPROVED";
    ExitPermissionStatus["REJECTED"] = "REJECTED";
    ExitPermissionStatus["CANCELLED"] = "CANCELLED";
    ExitPermissionStatus["COMPLETED"] = "COMPLETED";
})(ExitPermissionStatus || (exports.ExitPermissionStatus = ExitPermissionStatus = {}));
let ExitPermission = class ExitPermission {
    id;
    organization;
    student;
    requestedDepartureAt;
    expectedReturnAt;
    actualDepartureAt;
    actualReturnAt;
    returnRequestedAt;
    returnRequestNote;
    returnVerifiedBy;
    returnVerifiedAt;
    destination;
    reason;
    note;
    status;
    approver;
    reviewedAt;
    createdAt;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, organization: { required: true, type: () => require("./organization.entity").Organization }, student: { required: true, type: () => require("./student.entity").Student }, requestedDepartureAt: { required: true, type: () => Date }, expectedReturnAt: { required: false, type: () => Date, nullable: true }, actualDepartureAt: { required: false, type: () => Date, nullable: true }, actualReturnAt: { required: false, type: () => Date, nullable: true }, returnRequestedAt: { required: false, type: () => Date, nullable: true, description: "The student asks to be checked back in; a gate staff member confirms it." }, returnRequestNote: { required: true, type: () => String }, returnVerifiedBy: { required: false, type: () => require("./user.entity").User, nullable: true }, returnVerifiedAt: { required: false, type: () => Date, nullable: true }, destination: { required: true, type: () => String }, reason: { required: true, type: () => String }, note: { required: true, type: () => String }, status: { required: true, enum: require("./exit-permission.entity").ExitPermissionStatus }, approver: { required: false, type: () => require("./user.entity").User, nullable: true }, reviewedAt: { required: false, type: () => Date, nullable: true }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.ExitPermission = ExitPermission;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], ExitPermission.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, { nullable: false, onDelete: "CASCADE" }),
    __metadata("design:type", organization_entity_1.Organization)
], ExitPermission.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { nullable: false, onDelete: "CASCADE" }),
    __metadata("design:type", student_entity_1.Student)
], ExitPermission.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime" }),
    __metadata("design:type", Date)
], ExitPermission.prototype, "requestedDepartureAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], ExitPermission.prototype, "expectedReturnAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], ExitPermission.prototype, "actualDepartureAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], ExitPermission.prototype, "actualReturnAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], ExitPermission.prototype, "returnRequestedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", default: "" }),
    __metadata("design:type", String)
], ExitPermission.prototype, "returnRequestNote", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: "SET NULL" }),
    __metadata("design:type", Object)
], ExitPermission.prototype, "returnVerifiedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], ExitPermission.prototype, "returnVerifiedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], ExitPermission.prototype, "destination", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], ExitPermission.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", default: "" }),
    __metadata("design:type", String)
], ExitPermission.prototype, "note", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "varchar",
        length: 16,
        default: ExitPermissionStatus.PENDING,
    }),
    __metadata("design:type", String)
], ExitPermission.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: "SET NULL" }),
    __metadata("design:type", Object)
], ExitPermission.prototype, "approver", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], ExitPermission.prototype, "reviewedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ExitPermission.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ExitPermission.prototype, "updatedAt", void 0);
exports.ExitPermission = ExitPermission = __decorate([
    (0, typeorm_1.Entity)("exit_permissions")
], ExitPermission);
//# sourceMappingURL=exit-permission.entity.js.map