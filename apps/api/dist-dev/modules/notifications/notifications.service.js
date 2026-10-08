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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const cmb_notifications_1 = require("@moshaver/cmb-notifications");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const api_exception_1 = require("../../common/exceptions/api.exception");
const notification_entity_1 = require("../../database/entities/notification.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const realtime_1 = require("../realtime");
const push_service_1 = require("./push.service");
let NotificationsService = class NotificationsService {
    notifications;
    students;
    realtime;
    users;
    push;
    constructor(notifications, students, realtime, users, push) {
        this.notifications = notifications;
        this.students = students;
        this.realtime = realtime;
        this.users = users;
        this.push = push;
    }
    async createForUser(userId, input) { const user = this.users ? await this.users.findOneByOrFail({ id: userId }) : { id: userId }; if (input.dedupeKey) {
        const old = await this.notifications.findOne({ where: { user: { id: userId }, dedupeKey: input.dedupeKey } });
        if (old)
            return old;
    } const row = await this.notifications.save(this.notifications.create({ user, ...input, category: input.category || "general", priority: input.priority || "normal" })); this.realtime.emitToUser(userId, "notification.created", this.publicNotification(row)); if (this.push)
        await this.push.sendToUser(userId, { ...row }).catch(() => undefined); return row; }
    createForUsers(userIds, input) { return Promise.all([...new Set(userIds)].map(id => this.createForUser(id, input))); }
    async create(studentId, type, title, message) { const student = await this.students.findOneOrFail({ where: { id: studentId }, relations: { user: true } }); if (!student.user)
        throw new api_exception_1.ApiException(409, "STUDENT_USER_MISSING", "حساب کاربری دانش‌آموز موجود نیست."); return this.createForUser(student.user.id, { type, title, body: message }); }
    async findForUser(userId, options = {}) { const limit = (0, cmb_notifications_1.normalizePageLimit)(options.limit); const qb = this.notifications.createQueryBuilder("n").where("n.userId = :userId", { userId }); if (options.unreadOnly)
        qb.andWhere("n.readAt IS NULL"); if (options.category)
        qb.andWhere("n.category = :category", { category: options.category }); if (options.cursor) {
        try {
            qb.andWhere("(n.createdAt < :createdAt OR (n.createdAt = :createdAt AND n.id < :id))", (0, cmb_notifications_1.decodeCursor)(options.cursor));
        }
        catch {
            throw new api_exception_1.ApiException(400, "INVALID_CURSOR", "نشانگر صفحه نامعتبر است.");
        }
    } const rows = await qb.orderBy("n.createdAt", "DESC").addOrderBy("n.id", "DESC").take(limit + 1).getMany(); const hasMore = rows.length > limit; const items = rows.slice(0, limit); const last = items.at(-1); return { items: items.map(x => this.publicNotification(x)), unreadCount: await this.getUnreadCount(userId), hasMore, nextCursor: hasMore && last ? (0, cmb_notifications_1.encodeCursor)({ createdAt: last.createdAt, id: last.id }) : null }; }
    list(user, limit = 20) { return this.findForUser(user.id, { limit }); }
    getUnreadCount(userId) { return this.notifications.createQueryBuilder("n").where("n.userId=:userId", { userId }).andWhere("n.readAt IS NULL").getCount(); }
    async markRead(user, id) { const row = await this.notifications.findOne({ where: { id, user: { id: user.id } } }); if (!row)
        throw new api_exception_1.ApiException(404, "NOTIFICATION_NOT_FOUND", "اعلان پیدا نشد."); if (!row.readAt) {
        row.readAt = new Date();
        await this.notifications.save(row);
    } return this.publicNotification(row); }
    async markAllRead(user) { const result = await this.notifications.createQueryBuilder().update(notification_entity_1.Notification).set({ readAt: new Date() }).where("userId=:userId AND readAt IS NULL", { userId: user.id }).execute(); return { updated: result.affected || 0 }; }
    publicNotification(n) { return (0, cmb_notifications_1.projectNotification)(n); }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __param(1, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(4, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [typeorm_2.Repository, typeorm_2.Repository, realtime_1.RealtimeService, typeorm_2.Repository, push_service_1.PushService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map