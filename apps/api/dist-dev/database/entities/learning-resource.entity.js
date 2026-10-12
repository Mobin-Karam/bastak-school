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
exports.LearningResource = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const learning_resource_assignment_entity_1 = require("./learning-resource-assignment.entity");
let LearningResource = class LearningResource {
    id;
    title;
    description;
    type;
    category;
    url;
    status;
    createdBy;
    assignments;
    createdAt;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, title: { required: true, type: () => String }, description: { required: true, type: () => String }, type: { required: true, enum: ["LINK", "VIDEO"] }, category: { required: true, type: () => String }, url: { required: true, type: () => String }, status: { required: true, enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] }, createdBy: { required: true, type: () => require("./user.entity").User }, assignments: { required: true, type: () => [require("./learning-resource-assignment.entity").LearningResourceAssignment] }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.LearningResource = LearningResource;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], LearningResource.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 180 }),
    __metadata("design:type", String)
], LearningResource.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", default: "" }),
    __metadata("design:type", String)
], LearningResource.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 24, default: "LINK" }),
    __metadata("design:type", String)
], LearningResource.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 80, default: "عمومی" }),
    __metadata("design:type", String)
], LearningResource.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 1200 }),
    __metadata("design:type", String)
], LearningResource.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: "PUBLISHED" }),
    __metadata("design:type", String)
], LearningResource.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: false, onDelete: "CASCADE" }),
    __metadata("design:type", user_entity_1.User)
], LearningResource.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => learning_resource_assignment_entity_1.LearningResourceAssignment, (assignment) => assignment.resource),
    __metadata("design:type", Array)
], LearningResource.prototype, "assignments", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], LearningResource.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], LearningResource.prototype, "updatedAt", void 0);
exports.LearningResource = LearningResource = __decorate([
    (0, typeorm_1.Entity)("learning_resources")
], LearningResource);
//# sourceMappingURL=learning-resource.entity.js.map