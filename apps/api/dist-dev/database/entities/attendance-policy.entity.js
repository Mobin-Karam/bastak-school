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
exports.AttendancePolicy = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const organization_entity_1 = require("./organization.entity");
let AttendancePolicy = class AttendancePolicy {
    id;
    organization;
    timeZone;
    dayStartsAt;
    allowPartialSubmission;
    lateCountsAsPresent;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, organization: { required: true, type: () => require("./organization.entity").Organization }, timeZone: { required: true, type: () => String }, dayStartsAt: { required: true, type: () => String }, allowPartialSubmission: { required: true, type: () => Boolean }, lateCountsAsPresent: { required: true, type: () => Boolean }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.AttendancePolicy = AttendancePolicy;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], AttendancePolicy.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => organization_entity_1.Organization, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", organization_entity_1.Organization)
], AttendancePolicy.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 64, default: "Asia/Tehran" }),
    __metadata("design:type", String)
], AttendancePolicy.prototype, "timeZone", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 5, default: "04:00" }),
    __metadata("design:type", String)
], AttendancePolicy.prototype, "dayStartsAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], AttendancePolicy.prototype, "allowPartialSubmission", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], AttendancePolicy.prototype, "lateCountsAsPresent", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], AttendancePolicy.prototype, "updatedAt", void 0);
exports.AttendancePolicy = AttendancePolicy = __decorate([
    (0, typeorm_1.Entity)("attendance_policies")
], AttendancePolicy);
//# sourceMappingURL=attendance-policy.entity.js.map