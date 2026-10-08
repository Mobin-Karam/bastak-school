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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const api_exception_1 = require("../../common/exceptions/api.exception");
const daily_report_entity_1 = require("../../database/entities/daily-report.entity");
const recovery_request_entity_1 = require("../../database/entities/recovery-request.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const authorization_1 = require("../authorization");
const user_entity_1 = require("../../database/entities/user.entity");
let ReportsService = class ReportsService {
    reports;
    recoveries;
    students;
    authorization;
    users;
    constructor(reports, recoveries, students, authorization, users) {
        this.reports = reports;
        this.recoveries = recoveries;
        this.students = students;
        this.authorization = authorization;
        this.users = users;
    }
    async saveReport(userId, dto) {
        const student = await this.studentForUser(userId);
        let report = await this.reports.findOne({ where: { student: { id: student.id }, planDate: dto.planDate } });
        report = this.reports.create({ ...(report || {}), student, planDate: dto.planDate, focus: dto.focus, fatigue: dto.fatigue, motivation: dto.motivation, problem: dto.problem || "", tomorrow: dto.tomorrow || "" });
        return this.reports.save(report);
    }
    async listReports(userId, limit) {
        const student = await this.studentForUser(userId);
        return this.reports.find({ where: { student: { id: student.id } }, order: { planDate: "DESC" }, take: Math.min(Math.max(Number(limit) || 30, 1), 100) });
    }
    async createRecovery(userId, dto) {
        const student = await this.studentForUser(userId);
        return this.recoveries.save(this.recoveries.create({ student, planDate: dto.planDate || new Date().toISOString().slice(0, 10), reason: dto.reason || "", note: dto.note || "", status: recovery_request_entity_1.RecoveryRequestStatus.PENDING }));
    }
    async listRecovery(userId) {
        const student = await this.studentForUser(userId);
        return this.recoveries.find({ where: { student: { id: student.id } }, order: { createdAt: "DESC" }, take: 50 });
    }
    async reportsForStudent(context, studentId) {
        if (!await this.authorization.canAccessStudent(context, studentId, "reports.read"))
            throw new api_exception_1.ApiException(403, "STUDENT_FORBIDDEN", "به این دانش‌آموز دسترسی ندارید.");
        return this.reports.find({ where: { student: { id: studentId } }, order: { planDate: "DESC" }, take: 100 });
    }
    async recoveryForActor(context) {
        if (context.roles.includes("STUDENT"))
            return this.listRecovery(context.id);
        this.authorization.requireCapability(context, "recovery_requests.read");
        const rows = await this.recoveries.find({ relations: { student: true }, order: { createdAt: "DESC" }, take: 100 });
        const allowed = [];
        for (const row of rows)
            if (await this.authorization.canAccessStudent(context, row.student.id, "recovery_requests.read"))
                allowed.push(row);
        return allowed;
    }
    async moderateRecovery(context, id, status) {
        this.authorization.requireCapability(context, "recovery_requests.manage");
        if (![recovery_request_entity_1.RecoveryRequestStatus.RESOLVED, recovery_request_entity_1.RecoveryRequestStatus.DISMISSED].includes(status))
            throw new api_exception_1.ApiException(400, "STATUS_INVALID", "وضعیت معتبر نیست.");
        const row = await this.recoveries.findOne({ where: { id }, relations: { student: true } });
        if (!row)
            throw new api_exception_1.ApiException(404, "RECOVERY_NOT_FOUND", "درخواست پیدا نشد.");
        if (!await this.authorization.canAccessStudent(context, row.student.id, "recovery_requests.manage"))
            throw new api_exception_1.ApiException(403, "STUDENT_FORBIDDEN", "دسترسی ندارید.");
        row.status = status;
        return this.recoveries.save(row);
    }
    async studentForUser(userId) {
        const student = await this.students.findOne({ where: { user: { id: userId } } });
        if (!student)
            throw new api_exception_1.ApiException(404, "STUDENT_NOT_FOUND", "دانش‌آموز پیدا نشد.");
        return student;
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(daily_report_entity_1.DailyReport)),
    __param(1, (0, typeorm_1.InjectRepository)(recovery_request_entity_1.RecoveryRequest)),
    __param(2, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(4, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        authorization_1.AuthorizationService,
        typeorm_2.Repository])
], ReportsService);
//# sourceMappingURL=reports.service.js.map