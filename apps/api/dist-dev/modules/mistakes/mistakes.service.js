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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MistakesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const api_exception_1 = require("../../common/exceptions/api.exception");
const mistake_entity_1 = require("../../database/entities/mistake.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const authorization_1 = require("../authorization");
let MistakesService = class MistakesService {
    mistakes;
    students;
    authorization;
    constructor(mistakes, students, authorization) {
        this.mistakes = mistakes;
        this.students = students;
        this.authorization = authorization;
    }
    async list(userId, limit) {
        const student = await this.studentForUser(userId);
        const size = Math.min(200, Math.max(1, Number(limit) || 80));
        return this.mistakes.find({ where: { studentId: student.id }, order: { id: "DESC" }, take: size });
    }
    async listForStaff(context, studentId, limit) {
        if (!this.authorization || !await this.authorization.canAccessStudent(context, studentId, "mistakes.read"))
            throw new api_exception_1.ApiException(403, "STUDENT_FORBIDDEN", "به این دانش‌آموز دسترسی ندارید.");
        const size = Math.min(200, Math.max(1, Number(limit) || 80));
        return this.mistakes.find({ where: { studentId }, order: { id: "DESC" }, take: size });
    }
    async detail(userId, id) {
        const student = await this.studentForUser(userId);
        const mistake = await this.mistakes.findOne({ where: { id, studentId: student.id } });
        if (!mistake)
            throw new api_exception_1.ApiException(404, "MISTAKE_NOT_FOUND", "اشتباه پیدا نشد.");
        return mistake;
    }
    async update(userId, id, body) {
        const mistake = await this.detail(userId, id);
        if (body.reason !== undefined)
            mistake.reason = String(body.reason).trim();
        if (body.resolved !== undefined)
            mistake.resolved = Boolean(body.resolved);
        return this.mistakes.save(mistake);
    }
    async updateByQuestion(userId, questionId, body) {
        const student = await this.studentForUser(userId);
        const mistake = await this.mistakes.findOne({ where: { studentId: student.id, questionId } });
        if (!mistake)
            throw new api_exception_1.ApiException(404, "MISTAKE_NOT_FOUND", "این سؤال در دفترچه اشتباهات ثبت نشده است.");
        if (body.reason !== undefined)
            mistake.reason = String(body.reason).trim().slice(0, 100);
        if (body.resolved !== undefined)
            mistake.resolved = Boolean(body.resolved);
        return this.mistakes.save(mistake);
    }
    async studentForUser(userId) {
        const student = await this.students.findOne({ where: { user: { id: userId } } });
        if (!student)
            throw new api_exception_1.ApiException(404, "STUDENT_NOT_FOUND", "پرونده دانش‌آموز پیدا نشد.");
        return student;
    }
};
exports.MistakesService = MistakesService;
exports.MistakesService = MistakesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(mistake_entity_1.Mistake)),
    __param(1, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(2, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        authorization_1.AuthorizationService])
], MistakesService);
//# sourceMappingURL=mistakes.service.js.map