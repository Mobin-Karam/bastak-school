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
exports.UserRelationship = exports.RelationshipStatus = exports.RelationshipType = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const organization_entity_1 = require("./organization.entity");
const student_entity_1 = require("./student.entity");
const user_entity_1 = require("./user.entity");
var RelationshipType;
(function (RelationshipType) {
    RelationshipType["GUARDIAN_OF"] = "GUARDIAN_OF";
    RelationshipType["ADVISOR_OF"] = "ADVISOR_OF";
    RelationshipType["TEACHER_OF"] = "TEACHER_OF";
    RelationshipType["MENTOR_OF"] = "MENTOR_OF";
})(RelationshipType || (exports.RelationshipType = RelationshipType = {}));
var RelationshipStatus;
(function (RelationshipStatus) {
    RelationshipStatus["PENDING"] = "PENDING";
    RelationshipStatus["ACTIVE"] = "ACTIVE";
    RelationshipStatus["REJECTED"] = "REJECTED";
    RelationshipStatus["REVOKED"] = "REVOKED";
})(RelationshipStatus || (exports.RelationshipStatus = RelationshipStatus = {}));
let UserRelationship = class UserRelationship {
    id;
    fromUser;
    toStudent;
    organization;
    type;
    status;
    createdAt;
    updatedAt;
    acceptedAt;
    revokedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, fromUser: { required: true, type: () => require("./user.entity").User }, toStudent: { required: true, type: () => require("./student.entity").Student }, organization: { required: false, type: () => require("./organization.entity").Organization, nullable: true }, type: { required: true, enum: require("./user-relationship.entity").RelationshipType }, status: { required: true, enum: require("./user-relationship.entity").RelationshipStatus }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date }, acceptedAt: { required: false, type: () => Date, nullable: true }, revokedAt: { required: false, type: () => Date, nullable: true } };
    }
};
exports.UserRelationship = UserRelationship;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], UserRelationship.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: "CASCADE" }),
    __metadata("design:type", user_entity_1.User)
], UserRelationship.prototype, "fromUser", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { onDelete: "CASCADE" }),
    __metadata("design:type", student_entity_1.Student)
], UserRelationship.prototype, "toStudent", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, { nullable: true, onDelete: "CASCADE" }),
    __metadata("design:type", Object)
], UserRelationship.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 24 }),
    __metadata("design:type", String)
], UserRelationship.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: "varchar", length: 20, default: RelationshipStatus.PENDING }),
    __metadata("design:type", String)
], UserRelationship.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], UserRelationship.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], UserRelationship.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], UserRelationship.prototype, "acceptedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], UserRelationship.prototype, "revokedAt", void 0);
exports.UserRelationship = UserRelationship = __decorate([
    (0, typeorm_1.Entity)("user_relationships"),
    (0, typeorm_1.Index)(["fromUser", "toStudent", "organization", "type"], { unique: true })
], UserRelationship);
//# sourceMappingURL=user-relationship.entity.js.map