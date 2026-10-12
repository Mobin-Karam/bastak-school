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
exports.PlanTemplate = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const organization_entity_1 = require("./organization.entity");
const user_entity_1 = require("./user.entity");
let PlanTemplate = class PlanTemplate {
    id;
    organization;
    author;
    title;
    description;
    state;
    version;
    tags;
    days;
    createdAt;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, organization: { required: true, type: () => require("./organization.entity").Organization }, author: { required: false, type: () => require("./user.entity").User, nullable: true }, title: { required: true, type: () => String }, description: { required: true, type: () => String }, state: { required: true, enum: ["DRAFT", "PUBLISHED", "ARCHIVED", "IN_REVIEW"] }, version: { required: true, type: () => Number }, tags: { required: true, type: () => [String] }, days: { required: true, type: () => [Object] }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.PlanTemplate = PlanTemplate;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], PlanTemplate.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, { onDelete: "CASCADE" }),
    __metadata("design:type", organization_entity_1.Organization)
], PlanTemplate.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: "SET NULL" }),
    __metadata("design:type", Object)
], PlanTemplate.prototype, "author", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 180 }),
    __metadata("design:type", String)
], PlanTemplate.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", default: "" }),
    __metadata("design:type", String)
], PlanTemplate.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 20, default: "DRAFT" }),
    __metadata("design:type", String)
], PlanTemplate.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1 }),
    __metadata("design:type", Number)
], PlanTemplate.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-json", default: "[]" }),
    __metadata("design:type", Array)
], PlanTemplate.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-json", default: "[]" }),
    __metadata("design:type", Array)
], PlanTemplate.prototype, "days", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PlanTemplate.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], PlanTemplate.prototype, "updatedAt", void 0);
exports.PlanTemplate = PlanTemplate = __decorate([
    (0, typeorm_1.Entity)("plan_templates"),
    (0, typeorm_1.Index)(["organization", "state"])
], PlanTemplate);
//# sourceMappingURL=plan-template.entity.js.map