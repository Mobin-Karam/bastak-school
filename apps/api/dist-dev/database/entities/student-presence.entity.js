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
exports.StudentPresence = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const student_entity_1 = require("./student.entity");
const task_entity_1 = require("./task.entity");
let StudentPresence = class StudentPresence {
    id;
    student;
    state;
    syncStatus;
    currentTask;
    lastSeenAt;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, student: { required: true, type: () => require("./student.entity").Student }, state: { required: true, type: () => String }, syncStatus: { required: true, enum: ["online", "syncing", "failed", "offline"] }, currentTask: { required: false, type: () => require("./task.entity").Task, nullable: true }, lastSeenAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.StudentPresence = StudentPresence;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], StudentPresence.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => student_entity_1.Student, { nullable: false, onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", student_entity_1.Student)
], StudentPresence.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 24, default: "idle" }),
    __metadata("design:type", String)
], StudentPresence.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 16, default: "online" }),
    __metadata("design:type", String)
], StudentPresence.prototype, "syncStatus", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => task_entity_1.Task, { nullable: true, onDelete: "SET NULL" }),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", Object)
], StudentPresence.prototype, "currentTask", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime" }),
    __metadata("design:type", Date)
], StudentPresence.prototype, "lastSeenAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], StudentPresence.prototype, "updatedAt", void 0);
exports.StudentPresence = StudentPresence = __decorate([
    (0, typeorm_1.Entity)("student_presence")
], StudentPresence);
//# sourceMappingURL=student-presence.entity.js.map