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
exports.Task = exports.TaskType = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const plan_entity_1 = require("./plan.entity");
var TaskType;
(function (TaskType) {
    TaskType["STUDY"] = "STUDY";
    TaskType["TEST"] = "TEST";
    TaskType["REVIEW"] = "REVIEW";
    TaskType["EXAM"] = "EXAM";
    TaskType["REST"] = "REST";
    TaskType["CUSTOM"] = "CUSTOM";
    TaskType["CLASS"] = "CLASS";
    TaskType["PRAYER"] = "PRAYER";
    TaskType["MEAL"] = "MEAL";
    TaskType["BREAK"] = "BREAK";
})(TaskType || (exports.TaskType = TaskType = {}));
let Task = class Task {
    id;
    plan;
    type;
    title;
    subject;
    description;
    startTime;
    endTime;
    duration;
    testCount;
    note;
    status;
    priority;
    completedAt;
    actualMinutes;
    actualTests;
    completionDifficulty;
    completionNote;
    pages;
    examRef;
    examId;
    conflict;
    conflictGroup;
    createdAt;
    updatedAt;
    deletedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, plan: { required: true, type: () => require("./plan.entity").Plan }, type: { required: true, enum: require("./task.entity").TaskType }, title: { required: true, type: () => String }, subject: { required: true, type: () => String }, description: { required: true, type: () => String }, startTime: { required: true, type: () => String }, endTime: { required: true, type: () => String }, duration: { required: true, type: () => Number }, testCount: { required: true, type: () => Number }, note: { required: true, type: () => String }, status: { required: true, type: () => String }, priority: { required: true, type: () => Number }, completedAt: { required: false, type: () => Date, nullable: true }, actualMinutes: { required: true, type: () => Number }, actualTests: { required: true, type: () => Number }, completionDifficulty: { required: true, type: () => String }, completionNote: { required: true, type: () => String }, pages: { required: true, type: () => String }, examRef: { required: true, type: () => String }, examId: { required: true, type: () => String }, conflict: { required: true, type: () => Boolean }, conflictGroup: { required: true, type: () => String }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date }, deletedAt: { required: false, type: () => Date, nullable: true } };
    }
};
exports.Task = Task;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Task.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => plan_entity_1.Plan, (plan) => plan.tasks, { onDelete: "CASCADE" }),
    __metadata("design:type", plan_entity_1.Plan)
], Task.prototype, "plan", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 24 }),
    __metadata("design:type", String)
], Task.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 220 }),
    __metadata("design:type", String)
], Task.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], Task.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], Task.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], Task.prototype, "startTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], Task.prototype, "endTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Task.prototype, "duration", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Task.prototype, "testCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], Task.prototype, "note", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 24, default: "PLANNED" }),
    __metadata("design:type", String)
], Task.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Task.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], Task.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Task.prototype, "actualMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Task.prototype, "actualTests", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], Task.prototype, "completionDifficulty", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], Task.prototype, "completionNote", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], Task.prototype, "pages", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], Task.prototype, "examRef", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], Task.prototype, "examId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Task.prototype, "conflict", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], Task.prototype, "conflictGroup", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Task.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Task.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], Task.prototype, "deletedAt", void 0);
exports.Task = Task = __decorate([
    (0, typeorm_1.Entity)("tasks")
], Task);
//# sourceMappingURL=task.entity.js.map