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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentsService = void 0;
const common_1 = require("@nestjs/common");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const plan_entity_1 = require("../../database/entities/plan.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const topic_mastery_entity_1 = require("../../database/entities/topic-mastery.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const api_exception_1 = require("../../common/exceptions/api.exception");
const learning_item_entity_1 = require("../../database/entities/learning-item.entity");
const learning_review_entity_1 = require("../../database/entities/learning-review.entity");
const session_entity_1 = require("../../database/entities/session.entity");
let StudentsService = class StudentsService {
    students;
    users;
    mastery;
    learningItems;
    learningReviews;
    sessions;
    dataSource;
    constructor(students, users, mastery, learningItems, learningReviews, sessions, dataSource) {
        this.students = students;
        this.users = users;
        this.mastery = mastery;
        this.learningItems = learningItems;
        this.learningReviews = learningReviews;
        this.sessions = sessions;
        this.dataSource = dataSource;
    }
    list() {
        return this.students.find({
            relations: { user: true },
            order: { createdAt: "DESC" },
        });
    }
    async create(dto) {
        const username = String(dto.username || "").trim();
        const name = String(dto.name || username || "").trim();
        if (!username)
            throw new api_exception_1.ApiException(400, "USERNAME_REQUIRED", "نام کاربری دانش‌آموز الزامی است.");
        if (!name)
            throw new api_exception_1.ApiException(400, "NAME_REQUIRED", "نام دانش‌آموز الزامی است.");
        const exists = await this.users.findOne({ where: { username } });
        if (exists)
            throw new api_exception_1.ApiException(409, "USERNAME_EXISTS", "این نام کاربری قبلاً ثبت شده است.");
        const user = await this.users.save(this.users.create({
            username,
            passwordHash: await bcryptjs_1.default.hash(String(dto.password || "12345678"), 10),
            role: user_entity_1.UserRole.STUDENT,
        }));
        const student = await this.students.save(this.students.create({
            user,
            name,
            grade: dto.grade || "",
            major: dto.major || "",
            targetUniversity: dto.targetUniversity || "",
            targetField: dto.targetField || "",
            targetRank: dto.targetRank || "",
            dailyCapacity: dto.dailyCapacity || "",
        }));
        return this.findStudent(student.id);
    }
    async find(id) {
        return (await this.findStudent(id)) || this.findByUserId(id);
    }
    async chatPrivacy(userId) {
        const student = await this.findByUserId(userId);
        if (!student)
            throw new api_exception_1.ApiException(404, "STUDENT_NOT_FOUND", "پرونده دانش‌آموز پیدا نشد.");
        return { guardianReadOnly: !!student.guardianChatReadOnly };
    }
    async updateChatPrivacy(userId, enabled) {
        if (typeof enabled !== "boolean")
            throw new api_exception_1.ApiException(400, "INVALID_PRIVACY_VALUE", "مقدار دسترسی سرپرست نامعتبر است.");
        const student = await this.findByUserId(userId);
        if (!student)
            throw new api_exception_1.ApiException(404, "STUDENT_NOT_FOUND", "پرونده دانش‌آموز پیدا نشد.");
        student.guardianChatReadOnly = enabled;
        await this.students.save(student);
        return { guardianReadOnly: enabled };
    }
    findStudent(id) {
        return this.students.findOne({
            where: { id },
            relations: { user: true, plans: { tasks: true } },
        });
    }
    async update(id, dto) {
        const student = await this.findStudent(id);
        if (!student)
            throw new api_exception_1.ApiException(404, "STUDENT_NOT_FOUND", "پرونده دانش‌آموز پیدا نشد.");
        await this.students.update(id, {
            name: dto.name ?? student.name,
            gradeId: dto.gradeId ?? student.gradeId,
            learnerProfile: dto.learnerProfile ?? student.learnerProfile,
            independentType: dto.independentType ?? student.independentType,
            learningLevel: dto.learningLevel ?? student.learningLevel,
            educationTypeId: dto.educationTypeId ?? student.educationTypeId,
            trackId: dto.trackId ?? student.trackId,
            grade: dto.grade ?? student.grade,
            major: dto.major ?? student.major,
            targetUniversity: dto.targetUniversity ?? student.targetUniversity,
            targetField: dto.targetField ?? student.targetField,
            targetRank: dto.targetRank ?? student.targetRank,
            dailyCapacity: dto.dailyCapacity ?? student.dailyCapacity,
        });
        if (student.user && (dto.username || dto.password)) {
            await this.users.update(student.user.id, {
                username: dto.username ?? student.user.username,
                ...(dto.password
                    ? { passwordHash: await bcryptjs_1.default.hash(dto.password, 10) }
                    : {}),
            });
        }
        return this.findStudent(id);
    }
    async remove(id) {
        const student = await this.findStudent(id);
        if (!student)
            throw new api_exception_1.ApiException(404, "STUDENT_NOT_FOUND", "پرونده دانش‌آموز پیدا نشد.");
        await this.students.update(id, { accountStatus: "archived" });
        if (student.user)
            await this.sessions.delete({ user: { id: student.user.id } });
        return { id, archived: true };
    }
    async lifecycle(id, action) {
        const student = await this.findStudent(id);
        if (!student)
            throw new api_exception_1.ApiException(404, "STUDENT_NOT_FOUND", "پرونده دانش‌آموز پیدا نشد.");
        if (action === "force-logout") {
            if (student.user)
                await this.sessions.delete({ user: { id: student.user.id } });
            return { id, sessionsRevoked: true };
        }
        const accountStatus = action === "deactivate" ? "inactive" : "active";
        await this.students.update(id, { accountStatus });
        if (accountStatus !== "active" && student.user)
            await this.sessions.delete({ user: { id: student.user.id } });
        return this.findStudent(id);
    }
    async resetPassword(id, password) {
        if (password.length < 8)
            throw new api_exception_1.ApiException(400, "PASSWORD_TOO_SHORT", "رمز عبور باید حداقل ۸ نویسه باشد.");
        const student = await this.findStudent(id);
        if (!student?.user)
            throw new api_exception_1.ApiException(404, "STUDENT_USER_NOT_FOUND", "حساب دانش‌آموز پیدا نشد.");
        await this.users.update(student.user.id, {
            passwordHash: await bcryptjs_1.default.hash(password, 10),
        });
        await this.sessions.delete({ user: { id: student.user.id } });
        return { id, passwordReset: true, sessionsRevoked: true };
    }
    async weeklyForStudent(id) {
        const student = await this.findStudent(id);
        if (!student)
            throw new api_exception_1.ApiException(404, "STUDENT_NOT_FOUND", "پرونده دانش‌آموز پیدا نشد.");
        return this.progressForStudent(student);
    }
    async topicsForStudent(id, limit = 8) {
        await this.requireStudent(id);
        return this.mastery.find({
            where: { studentId: id },
            order: { score: "ASC", topic: "ASC" },
            take: Math.min(Math.max(limit, 1), 100),
        });
    }
    async learningForStudent(id) {
        await this.requireStudent(id);
        const items = await this.learningItems.find({
            where: { student: { id } },
            order: { dueDate: "ASC", createdAt: "DESC" },
        });
        return {
            summary: this.learningSummary(items),
            items: items.map((item) => this.publicLearningItem(item, id)),
        };
    }
    async createLearningItem(id, body) {
        const student = await this.requireStudent(id);
        const title = String(body.title || "").trim();
        if (title.length < 2)
            throw new api_exception_1.ApiException(400, "LEARNING_TITLE_REQUIRED", "عنوان یادگیری الزامی است.");
        const item = this.learningItems.create({
            student,
            ...this.learningInput(body),
            title,
        });
        return this.publicLearningItem(await this.learningItems.save(item), id);
    }
    async updateLearningItem(studentId, itemId, body) {
        const item = await this.learningItems.findOne({
            where: { id: itemId, student: { id: studentId } },
            relations: { student: true },
        });
        if (!item)
            throw new api_exception_1.ApiException(404, "LEARNING_ITEM_NOT_FOUND", "مورد یادگیری پیدا نشد.");
        const previousMastery = item.mastery;
        const previousIntervalDays = item.intervalDays;
        Object.assign(item, this.learningInput(body));
        if (body.title !== undefined)
            item.title = String(body.title).trim();
        if (item.status === learning_item_entity_1.LearningStatus.DONE && !item.completedAt)
            item.completedAt = new Date();
        if (item.status !== learning_item_entity_1.LearningStatus.DONE)
            item.completedAt = null;
        const saved = await this.learningItems.save(item);
        if (body.mastery !== undefined && saved.mastery !== previousMastery) {
            await this.learningReviews.save(this.learningReviews.create({
                item: saved,
                rating: saved.mastery,
                previousMastery,
                newMastery: saved.mastery,
                previousIntervalDays,
                nextIntervalDays: saved.intervalDays,
                nextReviewAt: saved.dueDate,
            }));
            await this.learningItems.increment({ id: saved.id }, "reviewCount", 1);
            saved.reviewCount += 1;
        }
        return this.publicLearningItem(saved, studentId);
    }
    async deleteLearningItem(studentId, itemId) {
        const result = await this.learningItems.delete({
            id: itemId,
            student: { id: studentId },
        });
        if (!result.affected)
            throw new api_exception_1.ApiException(404, "LEARNING_ITEM_NOT_FOUND", "مورد یادگیری پیدا نشد.");
        return { id: itemId, deleted: true };
    }
    async learningReviewHistory(studentId, itemId, limit = 50) {
        const item = await this.learningItems.findOne({
            where: { id: itemId, student: { id: studentId } },
        });
        if (!item)
            throw new api_exception_1.ApiException(404, "LEARNING_ITEM_NOT_FOUND", "مورد یادگیری پیدا نشد.");
        return this.learningReviews.find({
            where: { item: { id: itemId } },
            order: { reviewedAt: "DESC" },
            take: Math.min(Math.max(limit, 1), 100),
        });
    }
    async studentIdForUser(userId) {
        const student = await this.findByUserId(userId);
        if (!student)
            throw new api_exception_1.ApiException(404, "STUDENT_NOT_FOUND", "پرونده دانش‌آموز پیدا نشد.");
        return student.id;
    }
    async reviewLearningItem(studentId, itemId, rating) {
        const run = async (items, reviews) => {
            const item = await items.findOne({
                where: { id: itemId, student: { id: studentId } },
                relations: { student: true },
            });
            if (!item)
                throw new api_exception_1.ApiException(404, "LEARNING_ITEM_NOT_FOUND", "مورد یادگیری پیدا نشد.");
            const previousMastery = item.mastery;
            const previousIntervalDays = item.intervalDays;
            const safeRating = Math.min(5, Math.max(0, Number(rating)));
            item.mastery =
                Math.round((previousMastery * 0.6 + safeRating * 0.4) * 10) / 10;
            item.intervalDays =
                safeRating < 2
                    ? 1
                    : Math.max(1, Math.round(previousIntervalDays * (safeRating >= 4 ? 2 : 1.4)));
            item.dueDate = this.addDays(new Date().toISOString().slice(0, 10), item.intervalDays);
            item.reviewCount += 1;
            item.status = learning_item_entity_1.LearningStatus.PENDING;
            const saved = await items.save(item);
            const review = await reviews.save(reviews.create({
                item: saved,
                rating: safeRating,
                previousMastery,
                newMastery: saved.mastery,
                previousIntervalDays,
                nextIntervalDays: saved.intervalDays,
                nextReviewAt: saved.dueDate,
            }));
            return { item: this.publicLearningItem(saved, studentId), review };
        };
        return this.dataSource
            ? this.dataSource.transaction((manager) => run(manager.getRepository(learning_item_entity_1.LearningItem), manager.getRepository(learning_review_entity_1.LearningReview)))
            : run(this.learningItems, this.learningReviews);
    }
    async dashboard(userId) {
        const today = await this.today(userId);
        const completed = today.tasks.filter((task) => task.completedAt).length;
        return {
            student: today.student,
            plan: today.plan,
            tasks: today.tasks,
            metrics: {
                completed,
                total: today.tasks.length,
                percent: today.tasks.length
                    ? Math.round((completed / today.tasks.length) * 100)
                    : 0,
            },
            healthScore: null,
            risk: "unknown",
            todayStatus: completed > 0 ? "in_progress" : "not_started",
            recommendations: [],
        };
    }
    async today(userId) {
        return this.day(userId, new Date().toISOString().slice(0, 10));
    }
    async day(userId, isoDate) {
        if (!userId)
            return { student: null, plan: null, tasks: [] };
        const student = await this.findByUserId(userId);
        const date = isoDate || new Date().toISOString().slice(0, 10);
        const plan = student?.plans?.find((item) => item.date === date && item.status === plan_entity_1.PlanStatus.PUBLISHED) || null;
        return {
            student: this.publicStudent(student),
            plan,
            tasks: this.sortTasks(plan?.tasks || []),
        };
    }
    async progress(userId) {
        const student = userId ? await this.findByUserId(userId) : null;
        const today = new Date().toISOString().slice(0, 10);
        const from = this.addDays(today, -6);
        const days = (student?.plans || [])
            .filter((plan) => plan.status === plan_entity_1.PlanStatus.PUBLISHED &&
            plan.date >= from &&
            plan.date <= today)
            .sort((left, right) => left.date.localeCompare(right.date))
            .map((plan) => this.taskMetrics(plan.date, plan.tasks || []));
        const summary = days.reduce((result, day) => ({
            completed: result.completed + day.completed,
            total: result.total + day.total,
        }), { completed: 0, total: 0 });
        return {
            studentId: student?.id || null,
            completed: summary.completed,
            total: summary.total,
            percent: summary.total
                ? Math.round((summary.completed / summary.total) * 100)
                : 0,
            from,
            to: today,
            days,
        };
    }
    async reviews(userId) {
        const student = userId ? await this.findByUserId(userId) : null;
        const items = (student?.plans || [])
            .flatMap((plan) => plan.status === plan_entity_1.PlanStatus.PUBLISHED ? plan.tasks || [] : [])
            .filter((task) => task.type === "REVIEW")
            .sort((left, right) => (left.plan?.date || "").localeCompare(right.plan?.date || "") ||
            left.priority - right.priority);
        return { studentId: student?.id || null, items };
    }
    async learning(userId) {
        const student = userId ? await this.findByUserId(userId) : null;
        const items = student
            ? await this.mastery.find({
                where: { studentId: student.id },
                order: { score: "ASC", topic: "ASC" },
            })
            : [];
        return {
            studentId: student?.id || null,
            summary: {
                total: items.length,
                averageScore: items.length
                    ? Math.round((items.reduce((sum, item) => sum + item.score, 0) /
                        items.length) *
                        10) / 10
                    : 0,
            },
            items,
        };
    }
    async dashboardForStudent(studentId) {
        const student = await this.findStudent(studentId);
        if (!student)
            throw new api_exception_1.ApiException(404, "STUDENT_NOT_FOUND", "پرونده دانش‌آموز پیدا نشد.");
        const today = new Date().toISOString().slice(0, 10);
        const plan = student.plans?.find((item) => item.date === today && item.status === plan_entity_1.PlanStatus.PUBLISHED) || null;
        const tasks = this.sortTasks(plan?.tasks || []);
        const completed = tasks.filter((task) => task.completedAt).length;
        return {
            student: this.publicStudent(student),
            todayPlan: plan,
            plan,
            tasks,
            progress: {
                completed,
                total: tasks.length,
                percent: tasks.length
                    ? Math.round((completed / tasks.length) * 100)
                    : 0,
            },
            metrics: {
                completed,
                total: tasks.length,
                percent: tasks.length
                    ? Math.round((completed / tasks.length) * 100)
                    : 0,
            },
            healthScore: null,
            risk: "unknown",
            todayStatus: completed > 0 ? "in_progress" : "not_started",
            recommendations: [],
            alerts: [],
        };
    }
    findByUserId(userId) {
        return this.students.findOne({
            where: { user: { id: userId } },
            relations: { user: true, plans: { tasks: true } },
        });
    }
    publicStudent(student) {
        if (!student)
            throw new api_exception_1.ApiException(404, "STUDENT_NOT_FOUND", "پرونده دانش‌آموز پیدا نشد.");
        return {
            id: student.id,
            name: student.name,
            grade: student.grade,
            major: student.major,
            targetUniversity: student.targetUniversity,
            targetField: student.targetField,
            targetRank: student.targetRank,
            dailyCapacity: student.dailyCapacity,
        };
    }
    sortTasks(tasks) {
        return [...tasks].sort((left, right) => left.priority - right.priority ||
            left.startTime.localeCompare(right.startTime) ||
            left.title.localeCompare(right.title));
    }
    taskMetrics(date, tasks) {
        const completed = tasks.filter((task) => task.completedAt).length;
        return {
            date,
            completed,
            total: tasks.length,
            percent: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
        };
    }
    addDays(isoDate, days) {
        const date = new Date(`${isoDate}T00:00:00Z`);
        date.setUTCDate(date.getUTCDate() + days);
        return date.toISOString().slice(0, 10);
    }
    async requireStudent(id) {
        const student = await this.students.findOneBy({ id });
        if (!student)
            throw new api_exception_1.ApiException(404, "STUDENT_NOT_FOUND", "پرونده دانش‌آموز پیدا نشد.");
        return student;
    }
    progressForStudent(student) {
        const today = new Date().toISOString().slice(0, 10);
        const from = this.addDays(today, -6);
        const days = (student.plans || [])
            .filter((plan) => plan.date >= from && plan.date <= today)
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((plan) => this.taskMetrics(plan.date, plan.tasks || []));
        const totals = days.reduce((sum, day) => ({
            completed: sum.completed + day.completed,
            total: sum.total + day.total,
        }), { completed: 0, total: 0 });
        return {
            studentId: student.id,
            from,
            to: today,
            days,
            ...totals,
            percent: totals.total
                ? Math.round((totals.completed / totals.total) * 100)
                : 0,
        };
    }
    learningInput(body) {
        const status = Object.values(learning_item_entity_1.LearningStatus).includes(body.status)
            ? body.status
            : learning_item_entity_1.LearningStatus.PENDING;
        return {
            subject: String(body.subject || ""),
            book: String(body.book || ""),
            chapter: String(body.chapter || ""),
            lesson: String(body.lesson || ""),
            topic: String(body.topic || ""),
            note: String(body.note || ""),
            hint: String(body.hint || ""),
            dueDate: /^\d{4}-\d{2}-\d{2}$/.test(String(body.dueDate || ""))
                ? String(body.dueDate)
                : new Date().toISOString().slice(0, 10),
            mastery: Math.min(5, Math.max(0, Number(body.mastery || 0))),
            intervalDays: Math.max(1, Number(body.intervalDays || 1)),
            status,
        };
    }
    publicLearningItem(item, studentId) {
        return { ...item, student: undefined, studentId };
    }
    learningSummary(items) {
        const today = new Date().toISOString().slice(0, 10);
        const pending = items.filter((item) => item.status === learning_item_entity_1.LearningStatus.PENDING);
        const subjectMap = new Map();
        for (const item of items)
            subjectMap.set(item.subject || "بدون درس", [
                ...(subjectMap.get(item.subject || "بدون درس") || []),
                item,
            ]);
        return {
            totalItems: items.length,
            pendingItems: pending.length,
            dueItems: pending.filter((item) => item.dueDate <= today).length,
            averageMastery: items.length
                ? Math.round((items.reduce((sum, item) => sum + item.mastery, 0) /
                    items.length) *
                    10) / 10
                : 0,
            attempts: 0,
            averageExamPercent: 0,
            lastAttemptAt: null,
            subjects: [...subjectMap.entries()].map(([subject, rows]) => ({
                subject,
                items: rows.length,
                due: rows.filter((item) => item.status === learning_item_entity_1.LearningStatus.PENDING && item.dueDate <= today).length,
                mastery: Math.round((rows.reduce((sum, item) => sum + item.mastery, 0) / rows.length) *
                    10) / 10,
            })),
            mistakePatterns: [],
        };
    }
};
exports.StudentsService = StudentsService;
exports.StudentsService = StudentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(topic_mastery_entity_1.TopicMastery)),
    __param(3, (0, typeorm_1.InjectRepository)(learning_item_entity_1.LearningItem)),
    __param(4, (0, typeorm_1.InjectRepository)(learning_review_entity_1.LearningReview)),
    __param(5, (0, typeorm_1.InjectRepository)(session_entity_1.Session)),
    __param(6, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], StudentsService);
//# sourceMappingURL=students.service.js.map