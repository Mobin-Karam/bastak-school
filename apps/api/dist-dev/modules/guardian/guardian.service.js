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
exports.GuardianService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const api_exception_1 = require("../../common/exceptions/api.exception");
const audit_log_entity_1 = require("../../database/entities/audit-log.entity");
const attendance_record_entity_1 = require("../../database/entities/attendance-record.entity");
const daily_report_entity_1 = require("../../database/entities/daily-report.entity");
const encouragement_entity_1 = require("../../database/entities/encouragement.entity");
const exam_assignment_entity_1 = require("../../database/entities/exam-assignment.entity");
const plan_entity_1 = require("../../database/entities/plan.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const study_session_entity_1 = require("../../database/entities/study-session.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const user_relationship_entity_1 = require("../../database/entities/user-relationship.entity");
const plan_entity_2 = require("../../database/entities/plan.entity");
const user_relationship_entity_2 = require("../../database/entities/user-relationship.entity");
const exams_1 = require("../exams");
const notifications_1 = require("../notifications");
let GuardianService = class GuardianService {
    relationships;
    studentsRepo;
    plans;
    sessions;
    assignments;
    reportsRepo;
    encouragements;
    users;
    audit;
    attendanceRecords;
    notifications;
    examsService;
    constructor(relationships, studentsRepo, plans, sessions, assignments, reportsRepo, encouragements, users, audit, attendanceRecords, notifications, examsService) {
        this.relationships = relationships;
        this.studentsRepo = studentsRepo;
        this.plans = plans;
        this.sessions = sessions;
        this.assignments = assignments;
        this.reportsRepo = reportsRepo;
        this.encouragements = encouragements;
        this.users = users;
        this.audit = audit;
        this.attendanceRecords = attendanceRecords;
        this.notifications = notifications;
        this.examsService = examsService;
    }
    async students(userId) {
        const rows = await this.relationships.find({
            where: {
                fromUser: { id: userId },
                type: user_relationship_entity_2.RelationshipType.GUARDIAN_OF,
                status: user_relationship_entity_2.RelationshipStatus.ACTIVE,
            },
            relations: { toStudent: true },
        });
        return rows.map((r) => this.studentProjection(r.toStudent));
    }
    async dashboard(userId, studentId) {
        const student = await this.requireChild(userId, studentId);
        const [progress, schedule, exams] = await Promise.all([
            this.progress(userId, studentId),
            this.schedule(userId, studentId),
            this.exams(userId, studentId),
        ]);
        return {
            student: this.studentProjection(student),
            today: progress.today,
            weekly: progress.weekly,
            upcomingExams: exams.slice(0, 5),
            schedule: schedule.slice(0, 1),
            attention: progress.weekly.completionPercent < 50
                ? [
                    {
                        type: "LOW_PLAN_PROGRESS",
                        message: "پیشرفت برنامه این هفته نیاز به حمایت دارد.",
                    },
                ]
                : [],
        };
    }
    async progress(userId, studentId) {
        await this.requireChild(userId, studentId);
        const now = new Date(), today = now.toISOString().slice(0, 10), start = new Date(now);
        start.setDate(start.getDate() - 6);
        const plans = await this.plans.find({
            where: {
                student: { id: studentId },
                status: plan_entity_2.PlanStatus.PUBLISHED,
                date: (0, typeorm_2.Between)(start.toISOString().slice(0, 10), today),
            },
            relations: { tasks: true },
            order: { date: "ASC" },
        });
        const totals = plans.reduce((a, p) => ({
            tasks: a.tasks + p.tasks.length,
            done: a.done +
                p.tasks.filter((t) => !!t.completedAt || t.status === "DONE").length,
        }), { tasks: 0, done: 0 });
        const sessions = await this.sessions.find({
            where: { student: { id: studentId }, startedAt: (0, typeorm_2.Between)(start, now) },
        });
        const seconds = sessions.reduce((n, s) => n + s.elapsedSeconds, 0);
        const day = plans.find((p) => p.date === today);
        return {
            studentId,
            today: {
                date: today,
                totalTasks: day?.tasks.length || 0,
                completedTasks: day?.tasks.filter((t) => !!t.completedAt || t.status === "DONE")
                    .length || 0,
            },
            weekly: {
                from: start.toISOString().slice(0, 10),
                to: today,
                totalTasks: totals.tasks,
                completedTasks: totals.done,
                completionPercent: totals.tasks
                    ? Math.round((totals.done / totals.tasks) * 100)
                    : 0,
                studyMinutes: Math.round(seconds / 60),
            },
        };
    }
    async schedule(userId, studentId) {
        await this.requireChild(userId, studentId);
        const today = new Date().toISOString().slice(0, 10);
        const rows = await this.plans.find({
            where: { student: { id: studentId }, status: plan_entity_2.PlanStatus.PUBLISHED },
            relations: { tasks: true },
            order: { date: "ASC" },
            take: 14,
        });
        return rows
            .filter((p) => p.date >= today)
            .map((p) => ({
            id: p.id,
            date: p.date,
            tasks: p.tasks.map((t) => ({
                id: t.id,
                title: t.title,
                subject: t.subject,
                startTime: t.startTime,
                endTime: t.endTime,
                duration: t.duration,
                status: t.status,
                completed: !!t.completedAt,
            })),
        }));
    }
    async attendance(userId, studentId) {
        await this.requireChild(userId, studentId);
        const rows = await this.attendanceRecords.find({
            where: { student: { id: studentId } },
            relations: { session: { organization: true } },
            order: { createdAt: "DESC" },
            take: 60,
        });
        return rows.map((row) => ({
            id: row.id,
            status: row.status,
            note: row.note,
            sessionDate: row.session.sessionDate.toISOString(),
            organizationId: row.session.organization.id,
            recordedAt: row.createdAt.toISOString(),
        }));
    }
    async exams(userId, studentId) {
        await this.requireChild(userId, studentId);
        return this.examsService.listForGuardianStudent(studentId);
    }
    async reports(userId, studentId) {
        await this.requireChild(userId, studentId);
        const rows = await this.reportsRepo.find({
            where: { student: { id: studentId } },
            order: { planDate: "DESC" },
            take: 30,
        });
        return rows.map((r) => ({
            id: r.id,
            planDate: r.planDate,
            studyHours: r.studyHours,
            tests: r.tests,
            correct: r.correct,
            wrong: r.wrong,
            blank: r.blank,
            focus: r.focus,
            fatigue: r.fatigue,
            motivation: r.motivation,
        }));
    }
    async encourage(userId, studentId, input) {
        const student = await this.requireChild(userId, studentId);
        const message = String(input.message || "")
            .replace(/<[^>]*>/g, "")
            .trim()
            .slice(0, 500);
        if (!message)
            throw new api_exception_1.ApiException(400, "MESSAGE_REQUIRED", "متن تشویق الزامی است.");
        const guardian = await this.users.findOneByOrFail({ id: userId });
        const row = await this.encouragements.save(this.encouragements.create({
            student,
            guardian,
            message,
            kind: String(input.kind || "SUPPORT").slice(0, 40),
        }));
        if (student.user)
            await this.notifications.createForUser(student.user.id, {
                type: "GUARDIAN_ENCOURAGEMENT",
                category: "family",
                title: "پیام دلگرم‌کننده",
                body: message,
                url: "/more",
            });
        await this.audit.save(this.audit.create({
            user: guardian,
            action: "guardian.encouragement.create",
            entity: "encouragement",
            metadata: { encouragementId: row.id, studentId },
        }));
        return { id: row.id, createdAt: row.createdAt };
    }
    async requireChild(userId, studentId) {
        const relation = await this.relationships.findOne({
            where: {
                fromUser: { id: userId },
                toStudent: { id: studentId },
                type: user_relationship_entity_2.RelationshipType.GUARDIAN_OF,
                status: user_relationship_entity_2.RelationshipStatus.ACTIVE,
            },
            relations: { toStudent: { user: true } },
        });
        if (!relation)
            throw new api_exception_1.ApiException(404, "CHILD_NOT_FOUND", "دانش‌آموز مرتبط پیدا نشد.");
        return relation.toStudent;
    }
    studentProjection(s) {
        return {
            id: s.id,
            name: s.name,
            grade: s.grade,
            major: s.major,
            targetUniversity: s.targetUniversity,
            targetField: s.targetField,
        };
    }
};
exports.GuardianService = GuardianService;
exports.GuardianService = GuardianService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_relationship_entity_1.UserRelationship)),
    __param(1, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(2, (0, typeorm_1.InjectRepository)(plan_entity_1.Plan)),
    __param(3, (0, typeorm_1.InjectRepository)(study_session_entity_1.StudySession)),
    __param(4, (0, typeorm_1.InjectRepository)(exam_assignment_entity_1.ExamAssignment)),
    __param(5, (0, typeorm_1.InjectRepository)(daily_report_entity_1.DailyReport)),
    __param(6, (0, typeorm_1.InjectRepository)(encouragement_entity_1.Encouragement)),
    __param(7, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(8, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __param(9, (0, typeorm_1.InjectRepository)(attendance_record_entity_1.AttendanceRecord)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        notifications_1.NotificationsService,
        exams_1.ExamsService])
], GuardianService);
//# sourceMappingURL=guardian.service.js.map