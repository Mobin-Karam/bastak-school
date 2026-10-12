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
exports.Recommendation = exports.RecommendationStatus = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const student_entity_1 = require("./student.entity");
const user_entity_1 = require("./user.entity");
var RecommendationStatus;
(function (RecommendationStatus) {
    RecommendationStatus["PROPOSED"] = "PROPOSED";
    RecommendationStatus["ACCEPTED"] = "ACCEPTED";
    RecommendationStatus["REJECTED"] = "REJECTED";
    RecommendationStatus["DISMISSED"] = "DISMISSED";
})(RecommendationStatus || (exports.RecommendationStatus = RecommendationStatus = {}));
let Recommendation = class Recommendation {
    id;
    student;
    createdByType;
    createdByUser;
    type;
    title;
    reason;
    evidence;
    status;
    createdAt;
    actedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, student: { required: true, type: () => require("./student.entity").Student }, createdByType: { required: true, type: () => String }, createdByUser: { required: false, type: () => require("./user.entity").User, nullable: true }, type: { required: true, type: () => String }, title: { required: true, type: () => String }, reason: { required: true, type: () => String }, evidence: { required: true, type: "object", additionalProperties: true }, status: { required: true, enum: require("./recommendation.entity").RecommendationStatus }, createdAt: { required: true, type: () => Date }, actedAt: { required: false, type: () => Date, nullable: true } };
    }
};
exports.Recommendation = Recommendation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Recommendation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { onDelete: "CASCADE" }),
    __metadata("design:type", student_entity_1.Student)
], Recommendation.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 32 }),
    __metadata("design:type", String)
], Recommendation.prototype, "createdByType", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: "SET NULL" }),
    __metadata("design:type", Object)
], Recommendation.prototype, "createdByUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 48 }),
    __metadata("design:type", String)
], Recommendation.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 240 }),
    __metadata("design:type", String)
], Recommendation.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 1000 }),
    __metadata("design:type", String)
], Recommendation.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-json" }),
    __metadata("design:type", Object)
], Recommendation.prototype, "evidence", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 16, default: RecommendationStatus.PROPOSED }),
    __metadata("design:type", String)
], Recommendation.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Recommendation.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], Recommendation.prototype, "actedAt", void 0);
exports.Recommendation = Recommendation = __decorate([
    (0, typeorm_1.Entity)("recommendations")
], Recommendation);
//# sourceMappingURL=recommendation.entity.js.map