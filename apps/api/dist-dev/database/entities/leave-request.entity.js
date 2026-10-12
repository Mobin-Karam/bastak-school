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
exports.LeaveRequest = exports.LeaveRequestReviewerRole = exports.LeaveRequestType = exports.LeaveRequestStatus = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const organization_entity_1 = require("./organization.entity");
const student_entity_1 = require("./student.entity");
const user_entity_1 = require("./user.entity");
var LeaveRequestStatus;
(function (LeaveRequestStatus) {
    LeaveRequestStatus["PENDING"] = "PENDING";
    LeaveRequestStatus["APPROVED"] = "APPROVED";
    LeaveRequestStatus["REJECTED"] = "REJECTED";
    LeaveRequestStatus["CANCELLED"] = "CANCELLED";
    LeaveRequestStatus["COMPLETED"] = "COMPLETED";
})(LeaveRequestStatus || (exports.LeaveRequestStatus = LeaveRequestStatus = {}));
var LeaveRequestType;
(function (LeaveRequestType) {
    LeaveRequestType["SCHOOL_EXIT"] = "SCHOOL_EXIT";
    LeaveRequestType["LEAVE"] = "LEAVE";
})(LeaveRequestType || (exports.LeaveRequestType = LeaveRequestType = {}));
var LeaveRequestReviewerRole;
(function (LeaveRequestReviewerRole) {
    LeaveRequestReviewerRole["PRINCIPAL"] = "PRINCIPAL";
    LeaveRequestReviewerRole["SCHOOL_SUPERVISOR"] = "SCHOOL_SUPERVISOR";
})(LeaveRequestReviewerRole || (exports.LeaveRequestReviewerRole = LeaveRequestReviewerRole = {}));
let LeaveRequest = class LeaveRequest {
    id;
    organization;
    student;
    leaveType;
    reviewerRole;
    startDate;
    endDate;
    reason;
    note;
    attachments;
    status;
    approver;
    reviewedAt;
    createdAt;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, organization: { required: true, type: () => require("./organization.entity").Organization }, student: { required: true, type: () => require("./student.entity").Student }, leaveType: { required: true, type: () => String }, reviewerRole: { required: true, enum: require("./leave-request.entity").LeaveRequestReviewerRole }, startDate: { required: true, type: () => Date }, endDate: { required: true, type: () => Date }, reason: { required: true, type: () => String }, note: { required: true, type: () => String }, attachments: { required: true, type: () => [String] }, status: { required: true, enum: require("./leave-request.entity").LeaveRequestStatus }, approver: { required: false, type: () => require("./user.entity").User, nullable: true }, reviewedAt: { required: false, type: () => Date, nullable: true }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.LeaveRequest = LeaveRequest;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], LeaveRequest.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, { nullable: false, onDelete: "CASCADE" }),
    __metadata("design:type", organization_entity_1.Organization)
], LeaveRequest.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { nullable: false, onDelete: "CASCADE" }),
    __metadata("design:type", student_entity_1.Student)
], LeaveRequest.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 80, default: LeaveRequestType.LEAVE }),
    __metadata("design:type", String)
], LeaveRequest.prototype, "leaveType", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 32, default: LeaveRequestReviewerRole.PRINCIPAL }),
    __metadata("design:type", String)
], LeaveRequest.prototype, "reviewerRole", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime" }),
    __metadata("design:type", Date)
], LeaveRequest.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime" }),
    __metadata("design:type", Date)
], LeaveRequest.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], LeaveRequest.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", default: "" }),
    __metadata("design:type", String)
], LeaveRequest.prototype, "note", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-array", default: "" }),
    __metadata("design:type", Array)
], LeaveRequest.prototype, "attachments", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 16, default: LeaveRequestStatus.PENDING }),
    __metadata("design:type", String)
], LeaveRequest.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: "SET NULL" }),
    __metadata("design:type", Object)
], LeaveRequest.prototype, "approver", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], LeaveRequest.prototype, "reviewedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], LeaveRequest.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], LeaveRequest.prototype, "updatedAt", void 0);
exports.LeaveRequest = LeaveRequest = __decorate([
    (0, typeorm_1.Entity)("leave_requests")
], LeaveRequest);
//# sourceMappingURL=leave-request.entity.js.map