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
exports.SyncService = void 0;
const common_1 = require("@nestjs/common");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const api_exception_1 = require("../../common/exceptions/api.exception");
const exam_attempt_entity_1 = require("../../database/entities/exam-attempt.entity");
const notification_entity_1 = require("../../database/entities/notification.entity");
const plan_entity_1 = require("../../database/entities/plan.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const study_session_entity_1 = require("../../database/entities/study-session.entity");
const sync_mutation_entity_1 = require("../../database/entities/sync-mutation.entity");
const tasks_1 = require("../tasks");
const tasks_2 = require("../tasks");
const study_sessions_1 = require("../study-sessions");
const study_sessions_2 = require("../study-sessions");
const study_sessions_3 = require("../study-sessions");
const exam_entity_1 = require("../../database/entities/exam.entity");
const exam_assignment_entity_1 = require("../../database/entities/exam-assignment.entity");
const learning_item_entity_1 = require("../../database/entities/learning-item.entity");
const learning_review_entity_1 = require("../../database/entities/learning-review.entity");
const task_entity_1 = require("../../database/entities/task.entity");
const reports_1 = require("../reports");
const students_1 = require("../students");
const exams_1 = require("../exams");
let SyncService = class SyncService {
    students;
    plans;
    sessions;
    attempts;
    notifications;
    mutations;
    tasks;
    studySessions;
    taskRepo;
    exams;
    assignments;
    learning;
    reviews;
    reports;
    studentsService;
    examsService;
    constructor(students, plans, sessions, attempts, notifications, mutations, tasks, studySessions, taskRepo, exams, assignments, learning, reviews, reports, studentsService, examsService) {
        this.students = students;
        this.plans = plans;
        this.sessions = sessions;
        this.attempts = attempts;
        this.notifications = notifications;
        this.mutations = mutations;
        this.tasks = tasks;
        this.studySessions = studySessions;
        this.taskRepo = taskRepo;
        this.exams = exams;
        this.assignments = assignments;
        this.learning = learning;
        this.reviews = reviews;
        this.reports = reports;
        this.studentsService = studentsService;
        this.examsService = examsService;
    }
    async pull(user, lastSync) {
        const parsed = this.parseSince(lastSync);
        const since = parsed?.since;
        const student = await this.students.findOne({ where: { user: { id: user.id } } });
        if (!student)
            throw this.notFound();
        const planWhere = since ? { student: { id: student.id }, createdAt: (0, typeorm_2.MoreThanOrEqual)(since) } : { student: { id: student.id } };
        const assigned = this.assignments ? await this.assignments.find({ where: { student: { id: student.id } }, relations: { exam: { questions: true } } }) : [];
        const [plans, tasks, sessions, attempts, notifications, learningItems, reviews] = await Promise.all([
            this.plans.find({ where: planWhere, relations: { tasks: true }, order: { createdAt: "ASC" } }),
            this.taskRepo ? this.taskRepo.find({ where: { plan: { student: { id: student.id } }, ...(since ? { updatedAt: (0, typeorm_2.MoreThanOrEqual)(since) } : {}) }, relations: { plan: true }, order: { updatedAt: "ASC" }, take: 500 }) : [],
            this.sessions.find({ where: { student: { id: student.id }, ...(since ? { updatedAt: (0, typeorm_2.MoreThanOrEqual)(since) } : {}) }, relations: { task: true }, order: { updatedAt: "ASC" } }),
            this.attempts.find({ where: { student: { id: student.id }, ...(since ? { startedAt: (0, typeorm_2.MoreThanOrEqual)(since) } : {}) }, relations: { exam: true }, take: 500 }),
            this.notifications.find({ where: { user: { id: user.id }, ...(since ? { createdAt: (0, typeorm_2.MoreThanOrEqual)(since) } : {}) }, order: { createdAt: "ASC" }, take: 500 }),
            this.learning ? this.learning.find({ where: { student: { id: student.id }, ...(since ? { updatedAt: (0, typeorm_2.MoreThanOrEqual)(since) } : {}) }, order: { updatedAt: "ASC" }, take: 500 }) : [],
            this.reviews ? this.reviews.createQueryBuilder("r").innerJoin("r.item", "i").where("i.studentId=:studentId", { studentId: student.id }).andWhere(since ? "r.reviewedAt>=:since" : "1=1", { since }).orderBy("r.reviewedAt", "ASC").take(500).getMany() : [],
        ]);
        const serverTime = new Date();
        return {
            cursor: this.cursor(serverTime),
            reset: parsed?.reset || false,
            serverTime: serverTime.toISOString(),
            supported: { pull: ["plans", "tasks", "studySessions", "exams", "examAttempts", "notifications", "learningItems", "reviews"], upload: ["taskCompletion", "studySessions", "reports", "recoveryRequests", "reviews", "examAutosave"] },
            unsupported: ["messages", "planWrites", "examSubmission", "notificationWrites"],
            plans,
            tasks: this.taskRepo ? tasks : plans.flatMap((plan) => plan.tasks || []),
            studySessions: sessions,
            exams: assigned.map(item => item.exam).filter(exam => !exam.deletedAt).map(exam => ({ id: exam.id, title: exam.title, subject: exam.subject, durationMinutes: exam.duration, openAt: exam.startTime, closeAt: exam.endTime, questionCount: exam.questions?.length || 0, updatedAt: exam.updatedAt })),
            examAttempts: attempts,
            notifications,
            learningItems,
            reviews,
        };
    }
    async upload(user, changes) {
        const accepted = [];
        const rejected = [];
        for (const change of changes) {
            const mutationId = change.clientMutationId || change.id;
            const existing = await this.mutations.findOne({ where: { userId: user.id, clientMutationId: mutationId } });
            if (existing) {
                accepted.push({ id: change.id, result: existing.result, replayed: true });
                continue;
            }
            try {
                const result = await this.apply(user.id, change);
                await this.mutations.save(this.mutations.create({ userId: user.id, mutationId, clientMutationId: mutationId, type: change.type || "api_mutation", method: change.method, path: change.path, result }));
                accepted.push({ id: change.id, result });
            }
            catch (error) {
                if (error instanceof api_exception_1.ApiException)
                    rejected.push({ id: change.id, code: String(error.getResponse().error?.code || "REJECTED") });
                else
                    throw error;
            }
        }
        return { accepted, rejected, acceptedCount: accepted.length, rejectedCount: rejected.length, serverTime: new Date().toISOString() };
    }
    async apply(userId, change) {
        const path = change.path.split("?")[0].replace(/\/$/, "");
        if (change.method === "POST" && /^\/student\/tasks\/[^/]+\/complete$/.test(path)) {
            return this.tasks.complete(userId, path.split("/")[3], await this.validatedBody(tasks_1.CompleteTaskDto, change.body));
        }
        if (change.method === "POST" && path === "/reports" && this.reports)
            return this.reports.saveReport(userId, change.body);
        if (change.method === "POST" && path === "/recovery-requests" && this.reports)
            return this.reports.createRecovery(userId, change.body);
        const review = path.match(/^\/student\/learning\/([^/]+)\/review$/);
        if (change.method === "POST" && review && this.studentsService) {
            const student = await this.students.findOneOrFail({ where: { user: { id: userId } } });
            return this.studentsService.reviewLearningItem(student.id, review[1], Number(change.body?.rating));
        }
        const autosave = path.match(/^\/student\/exams\/attempts\/([^/]+)$/);
        if (change.method === "PATCH" && autosave && this.examsService)
            return this.examsService.saveProgress(autosave[1], Array.isArray(change.body?.answers) ? change.body.answers : [], userId);
        const sessionMatch = path.match(/^\/student\/study-sessions(?:\/([^/]+)\/(heartbeat|pause|resume|finish)|)$/);
        if (change.method === "POST" && sessionMatch) {
            if (!sessionMatch[1]) {
                return this.studySessions.start(userId, (await this.validatedBody(study_sessions_2.StartStudySessionDto, change.body)).taskId);
            }
            const sessionId = sessionMatch[1];
            if (sessionMatch[2] === "heartbeat")
                return this.studySessions.heartbeat(userId, sessionId);
            if (sessionMatch[2] === "pause")
                return this.studySessions.pause(userId, sessionId);
            if (sessionMatch[2] === "resume")
                return this.studySessions.resume(userId, sessionId);
            return this.studySessions.finish(userId, sessionId, await this.validatedBody(study_sessions_1.FinishStudySessionDto, change.body));
        }
        throw new api_exception_1.ApiException(400, "SYNC_UNSUPPORTED_MUTATION", "این تغییر برای همگام‌سازی پشتیبانی نمی‌شود.");
    }
    requireObject(body) {
        if (!body || typeof body !== "object" || Array.isArray(body))
            throw new api_exception_1.ApiException(400, "SYNC_INVALID_BODY", "بدنه تغییر نامعتبر است.");
    }
    async validatedBody(type, body) {
        this.requireObject(body);
        const value = (0, class_transformer_1.plainToInstance)(type, body);
        if ((await (0, class_validator_1.validate)(value, { whitelist: true, forbidNonWhitelisted: true })).length)
            throw new api_exception_1.ApiException(400, "SYNC_INVALID_BODY", "بدنه تغییر نامعتبر است.");
        return value;
    }
    parseSince(value) {
        if (!value)
            return undefined;
        try {
            const decoded = JSON.parse(Buffer.from(value, "base64url").toString());
            const date = new Date(decoded.t);
            if (decoded.v !== 1 || Number.isNaN(date.getTime()) || date.getTime() > Date.now() + 60_000)
                throw new Error();
            const stale = Date.now() - date.getTime() > 90 * 86400000;
            return { since: stale ? undefined : date, reset: stale };
        }
        catch {
            throw new api_exception_1.ApiException(400, "SYNC_INVALID_CURSOR", "نشانگر همگام‌سازی نامعتبر است.");
        }
    }
    cursor(date) { return Buffer.from(JSON.stringify({ v: 1, t: date.toISOString() })).toString("base64url"); }
    notFound() {
        return new api_exception_1.ApiException(404, "STUDENT_NOT_FOUND", "دانش‌آموز پیدا نشد.");
    }
};
exports.SyncService = SyncService;
exports.SyncService = SyncService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(1, (0, typeorm_1.InjectRepository)(plan_entity_1.Plan)),
    __param(2, (0, typeorm_1.InjectRepository)(study_session_entity_1.StudySession)),
    __param(3, (0, typeorm_1.InjectRepository)(exam_attempt_entity_1.ExamAttempt)),
    __param(4, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __param(5, (0, typeorm_1.InjectRepository)(sync_mutation_entity_1.SyncMutation)),
    __param(8, (0, typeorm_1.InjectRepository)(task_entity_1.Task)),
    __param(9, (0, typeorm_1.InjectRepository)(exam_entity_1.Exam)),
    __param(10, (0, typeorm_1.InjectRepository)(exam_assignment_entity_1.ExamAssignment)),
    __param(11, (0, typeorm_1.InjectRepository)(learning_item_entity_1.LearningItem)),
    __param(12, (0, typeorm_1.InjectRepository)(learning_review_entity_1.LearningReview)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        tasks_2.TasksService,
        study_sessions_3.StudySessionsService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        reports_1.ReportsService,
        students_1.StudentsService,
        exams_1.ExamsService])
], SyncService);
//# sourceMappingURL=sync.service.js.map