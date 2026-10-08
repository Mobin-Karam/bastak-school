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
exports.StudySession = exports.StudySessionStatus = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const student_entity_1 = require("./student.entity");
const task_entity_1 = require("./task.entity");
var StudySessionStatus;
(function (StudySessionStatus) {
    StudySessionStatus["ACTIVE"] = "ACTIVE";
    StudySessionStatus["PAUSED"] = "PAUSED";
    StudySessionStatus["FINISHED"] = "FINISHED";
})(StudySessionStatus || (exports.StudySessionStatus = StudySessionStatus = {}));
let StudySession = class StudySession {
    id;
    student;
    task;
    status;
    startedAt;
    lastStartedAt;
    lastHeartbeatAt;
    pausedAt;
    finishedAt;
    elapsedSeconds;
    actualTests;
    difficulty;
    note;
    createdAt;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, student: { required: true, type: () => require("./student.entity").Student }, task: { required: true, type: () => require("./task.entity").Task }, status: { required: true, enum: require("./study-session.entity").StudySessionStatus }, startedAt: { required: true, type: () => Date }, lastStartedAt: { required: false, type: () => Date, nullable: true }, lastHeartbeatAt: { required: false, type: () => Date, nullable: true }, pausedAt: { required: false, type: () => Date, nullable: true }, finishedAt: { required: false, type: () => Date, nullable: true }, elapsedSeconds: { required: true, type: () => Number }, actualTests: { required: true, type: () => Number }, difficulty: { required: true, type: () => String }, note: { required: true, type: () => String }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.StudySession = StudySession;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], StudySession.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { onDelete: "CASCADE" }),
    __metadata("design:type", student_entity_1.Student)
], StudySession.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => task_entity_1.Task, { onDelete: "CASCADE" }),
    __metadata("design:type", task_entity_1.Task)
], StudySession.prototype, "task", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 24, default: StudySessionStatus.ACTIVE }),
    __metadata("design:type", String)
], StudySession.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime" }),
    __metadata("design:type", Date)
], StudySession.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], StudySession.prototype, "lastStartedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], StudySession.prototype, "lastHeartbeatAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], StudySession.prototype, "pausedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], StudySession.prototype, "finishedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], StudySession.prototype, "elapsedSeconds", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], StudySession.prototype, "actualTests", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], StudySession.prototype, "difficulty", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], StudySession.prototype, "note", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], StudySession.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], StudySession.prototype, "updatedAt", void 0);
exports.StudySession = StudySession = __decorate([
    (0, typeorm_1.Entity)("study_sessions"),
    (0, typeorm_1.Index)(["student", "status"])
], StudySession);
//# sourceMappingURL=study-session.entity.js.map