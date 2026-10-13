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
exports.LearningResourceAssignment = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const learning_resource_entity_1 = require("./learning-resource.entity");
const student_entity_1 = require("./student.entity");
let LearningResourceAssignment = class LearningResourceAssignment {
    id;
    resource;
    student;
    assignedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, resource: { required: true, type: () => require("./learning-resource.entity").LearningResource }, student: { required: true, type: () => require("./student.entity").Student }, assignedAt: { required: true, type: () => Date } };
    }
};
exports.LearningResourceAssignment = LearningResourceAssignment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], LearningResourceAssignment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => learning_resource_entity_1.LearningResource, (resource) => resource.assignments, {
        nullable: false,
        onDelete: "CASCADE",
    }),
    __metadata("design:type", learning_resource_entity_1.LearningResource)
], LearningResourceAssignment.prototype, "resource", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { nullable: false, onDelete: "CASCADE" }),
    __metadata("design:type", student_entity_1.Student)
], LearningResourceAssignment.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], LearningResourceAssignment.prototype, "assignedAt", void 0);
exports.LearningResourceAssignment = LearningResourceAssignment = __decorate([
    (0, typeorm_1.Entity)("learning_resource_assignments"),
    (0, typeorm_1.Unique)(["resource", "student"])
], LearningResourceAssignment);
//# sourceMappingURL=learning-resource-assignment.entity.js.map