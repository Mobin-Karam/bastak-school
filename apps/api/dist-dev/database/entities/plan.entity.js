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
exports.Plan = exports.PlanStatus = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const student_entity_1 = require("./student.entity");
const task_entity_1 = require("./task.entity");
var PlanStatus;
(function (PlanStatus) {
    PlanStatus["DRAFT"] = "DRAFT";
    PlanStatus["PUBLISHED"] = "PUBLISHED";
    PlanStatus["ARCHIVED"] = "ARCHIVED";
})(PlanStatus || (exports.PlanStatus = PlanStatus = {}));
let Plan = class Plan {
    id;
    student;
    date;
    status;
    title;
    dayLabel;
    persianDate;
    jalaliId;
    motivationText;
    templateId;
    templateVersion;
    createdAt;
    updatedAt;
    deletedAt;
    tasks;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, student: { required: true, type: () => require("./student.entity").Student }, date: { required: true, type: () => String }, status: { required: true, enum: require("./plan.entity").PlanStatus }, title: { required: true, type: () => String }, dayLabel: { required: true, type: () => String }, persianDate: { required: true, type: () => String }, jalaliId: { required: true, type: () => String }, motivationText: { required: true, type: () => String }, templateId: { required: false, type: () => String, nullable: true, description: "Immutable source when this plan was created from an organization template." }, templateVersion: { required: false, type: () => Number, nullable: true }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date }, deletedAt: { required: false, type: () => Date, nullable: true }, tasks: { required: true, type: () => [require("./task.entity").Task] } };
    }
};
exports.Plan = Plan;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Plan.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, (student) => student.plans, { onDelete: "CASCADE" }),
    __metadata("design:type", student_entity_1.Student)
], Plan.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", String)
], Plan.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 24, default: PlanStatus.DRAFT }),
    __metadata("design:type", String)
], Plan.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "برنامه روزانه" }),
    __metadata("design:type", String)
], Plan.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], Plan.prototype, "dayLabel", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], Plan.prototype, "persianDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], Plan.prototype, "jalaliId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 600, default: "" }),
    __metadata("design:type", String)
], Plan.prototype, "motivationText", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], Plan.prototype, "templateId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "integer", nullable: true }),
    __metadata("design:type", Object)
], Plan.prototype, "templateVersion", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Plan.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Plan.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], Plan.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => task_entity_1.Task, (task) => task.plan, { cascade: true }),
    __metadata("design:type", Array)
], Plan.prototype, "tasks", void 0);
exports.Plan = Plan = __decorate([
    (0, typeorm_1.Entity)("plans"),
    (0, typeorm_1.Index)(["student", "date"], { unique: true })
], Plan);
//# sourceMappingURL=plan.entity.js.map