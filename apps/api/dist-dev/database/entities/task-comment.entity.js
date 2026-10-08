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
exports.TaskComment = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const student_entity_1 = require("./student.entity");
const task_entity_1 = require("./task.entity");
let TaskComment = class TaskComment {
    id;
    task;
    student;
    text;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, task: { required: true, type: () => require("./task.entity").Task }, student: { required: true, type: () => require("./student.entity").Student }, text: { required: true, type: () => String }, createdAt: { required: true, type: () => Date } };
    }
};
exports.TaskComment = TaskComment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], TaskComment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => task_entity_1.Task, { onDelete: "CASCADE" }),
    __metadata("design:type", task_entity_1.Task)
], TaskComment.prototype, "task", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { onDelete: "CASCADE" }),
    __metadata("design:type", student_entity_1.Student)
], TaskComment.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 2000 }),
    __metadata("design:type", String)
], TaskComment.prototype, "text", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TaskComment.prototype, "createdAt", void 0);
exports.TaskComment = TaskComment = __decorate([
    (0, typeorm_1.Entity)("task_comments")
], TaskComment);
//# sourceMappingURL=task-comment.entity.js.map