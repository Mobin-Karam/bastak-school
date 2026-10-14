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
exports.RecoveryRequest = exports.RecoveryRequestStatus = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const student_entity_1 = require("./student.entity");
var RecoveryRequestStatus;
(function (RecoveryRequestStatus) {
    RecoveryRequestStatus["PENDING"] = "pending";
    RecoveryRequestStatus["RESOLVED"] = "resolved";
    RecoveryRequestStatus["DISMISSED"] = "dismissed";
})(RecoveryRequestStatus || (exports.RecoveryRequestStatus = RecoveryRequestStatus = {}));
let RecoveryRequest = class RecoveryRequest {
    id;
    student;
    planDate;
    reason;
    note;
    status;
    createdAt;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, student: { required: true, type: () => require("./student.entity").Student }, planDate: { required: true, type: () => String }, reason: { required: true, type: () => String }, note: { required: true, type: () => String }, status: { required: true, enum: require("./recovery-request.entity").RecoveryRequestStatus }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.RecoveryRequest = RecoveryRequest;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], RecoveryRequest.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, (student) => student.recoveryRequests, {
        nullable: false,
        onDelete: "CASCADE",
    }),
    __metadata("design:type", student_entity_1.Student)
], RecoveryRequest.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", String)
], RecoveryRequest.prototype, "planDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 200, default: "" }),
    __metadata("design:type", String)
], RecoveryRequest.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 1500, default: "" }),
    __metadata("design:type", String)
], RecoveryRequest.prototype, "note", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "varchar",
        length: 24,
        default: RecoveryRequestStatus.PENDING,
    }),
    __metadata("design:type", String)
], RecoveryRequest.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], RecoveryRequest.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], RecoveryRequest.prototype, "updatedAt", void 0);
exports.RecoveryRequest = RecoveryRequest = __decorate([
    (0, typeorm_1.Entity)("recovery_requests")
], RecoveryRequest);
//# sourceMappingURL=recovery-request.entity.js.map