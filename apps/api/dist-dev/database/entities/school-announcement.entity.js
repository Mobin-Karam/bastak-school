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
exports.SchoolAnnouncement = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const education_class_entity_1 = require("./education-class.entity");
const organization_entity_1 = require("./organization.entity");
const user_entity_1 = require("./user.entity");
let SchoolAnnouncement = class SchoolAnnouncement {
    id;
    organization;
    audience;
    classroom;
    title;
    body;
    status;
    publishedAt;
    expiresAt;
    createdBy;
    createdAt;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, organization: { required: true, type: () => require("./organization.entity").Organization }, audience: { required: true, enum: ["CLASS", "STAFF", "STUDENTS"] }, classroom: { required: false, type: () => require("./education-class.entity").EducationClass, nullable: true }, title: { required: true, type: () => String }, body: { required: true, type: () => String }, status: { required: true, enum: ["DRAFT", "ARCHIVED", "ACTIVE"] }, publishedAt: { required: false, type: () => Date, nullable: true }, expiresAt: { required: false, type: () => Date, nullable: true }, createdBy: { required: false, type: () => require("./user.entity").User, nullable: true }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.SchoolAnnouncement = SchoolAnnouncement;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], SchoolAnnouncement.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, { nullable: false, onDelete: "CASCADE" }),
    __metadata("design:type", organization_entity_1.Organization)
], SchoolAnnouncement.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 16 }),
    __metadata("design:type", String)
], SchoolAnnouncement.prototype, "audience", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => education_class_entity_1.EducationClass, { nullable: true, onDelete: "CASCADE" }),
    __metadata("design:type", Object)
], SchoolAnnouncement.prototype, "classroom", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 180 }),
    __metadata("design:type", String)
], SchoolAnnouncement.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], SchoolAnnouncement.prototype, "body", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 16, default: "ACTIVE" }),
    __metadata("design:type", String)
], SchoolAnnouncement.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], SchoolAnnouncement.prototype, "publishedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], SchoolAnnouncement.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: "SET NULL" }),
    __metadata("design:type", Object)
], SchoolAnnouncement.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SchoolAnnouncement.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], SchoolAnnouncement.prototype, "updatedAt", void 0);
exports.SchoolAnnouncement = SchoolAnnouncement = __decorate([
    (0, typeorm_1.Entity)("school_announcements"),
    (0, typeorm_1.Index)(["organization", "audience", "publishedAt"])
], SchoolAnnouncement);
//# sourceMappingURL=school-announcement.entity.js.map