"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const webPush = __importStar(require("web-push"));
const api_exception_1 = require("../../common/exceptions/api.exception");
const notification_preference_entity_1 = require("../../database/entities/notification-preference.entity");
const push_subscription_entity_1 = require("../../database/entities/push-subscription.entity");
const user_entity_1 = require("../../database/entities/user.entity");
let PushService = class PushService {
    subscriptions;
    preferences;
    users;
    enabled;
    publicKey;
    constructor(subscriptions, preferences, users) {
        this.subscriptions = subscriptions;
        this.preferences = preferences;
        this.users = users;
        this.publicKey = process.env.VAPID_PUBLIC_KEY || "";
        this.enabled = !!(this.publicKey &&
            process.env.VAPID_PRIVATE_KEY &&
            process.env.VAPID_SUBJECT);
        if (this.enabled)
            webPush.setVapidDetails(process.env.VAPID_SUBJECT, this.publicKey, process.env.VAPID_PRIVATE_KEY);
    }
    config() {
        return {
            enabled: this.enabled,
            publicKey: this.publicKey,
            supported: this.enabled,
            vapidPublicKey: this.publicKey,
        };
    }
    async status(userId, endpoint) {
        const [registered, preference, subscriptions] = await Promise.all([
            endpoint
                ? this.subscriptions.exist({
                    where: { user: { id: userId }, endpoint },
                })
                : this.subscriptions.exist({ where: { user: { id: userId } } }),
            this.preferences.findOne({ where: { user: { id: userId } } }),
            this.subscriptions.find({
                where: { user: { id: userId } },
                order: { updatedAt: "DESC" },
                take: 20,
            }),
        ]);
        const categories = preference?.categories || {};
        return {
            serverConfigured: this.enabled,
            registered,
            preferences: {
                lessons: categories.lessons ?? true,
                messages: categories.messages ?? true,
                exams: categories.exams ?? true,
                announcements: categories.announcements ?? true,
            },
            devices: subscriptions.map((row) => ({
                id: row.id,
                userAgent: row.userAgent || "مرورگر ناشناس",
                failureCount: row.failureCount,
                lastSuccessAt: row.lastSuccessAt?.toISOString() || null,
                updatedAt: row.updatedAt.toISOString(),
                current: Boolean(endpoint && row.endpoint === endpoint),
            })),
        };
    }
    async subscribe(userId, body, userAgent = "") {
        if (!body.endpoint?.startsWith("https://") ||
            !body.keys?.p256dh ||
            !body.keys?.auth)
            throw new api_exception_1.ApiException(400, "INVALID_SUBSCRIPTION", "اشتراک اعلان معتبر نیست.");
        const user = await this.users.findOneByOrFail({ id: userId });
        let row = await this.subscriptions.findOne({
            where: { endpoint: body.endpoint },
        });
        row ||= this.subscriptions.create({ endpoint: body.endpoint, user });
        Object.assign(row, {
            user,
            p256dh: body.keys.p256dh,
            auth: body.keys.auth,
            userAgent: userAgent.slice(0, 300),
            failureCount: 0,
        });
        return this.subscriptions.save(row);
    }
    async unsubscribe(userId, endpoint) {
        const qb = this.subscriptions
            .createQueryBuilder()
            .delete()
            .where("userId=:userId", { userId });
        if (endpoint)
            qb.andWhere("endpoint=:endpoint", { endpoint });
        const result = await qb.execute();
        return { removed: result.affected || 0 };
    }
    async setPreferences(userId, input) {
        const user = await this.users.findOneByOrFail({ id: userId });
        let row = await this.preferences.findOne({
            where: { user: { id: userId } },
        });
        row ||= this.preferences.create({ user, enabled: true, categories: {} });
        if (input.enabled !== undefined)
            row.enabled = input.enabled;
        const flat = Object.fromEntries(["lessons", "messages", "exams", "announcements"]
            .filter((k) => typeof input[k] === "boolean")
            .map((k) => [k, input[k]]));
        row.categories = {
            ...row.categories,
            ...flat,
            ...(input.categories || {}),
        };
        await this.preferences.save(row);
        return this.status(userId);
    }
    async sendToUser(userId, n) {
        if (!this.enabled)
            return { sent: 0, removed: 0 };
        const preference = await this.preferences.findOne({
            where: { user: { id: userId } },
        });
        const category = n.category || "general";
        if (preference &&
            (!preference.enabled || preference.categories[category] === false))
            return { sent: 0, removed: 0 };
        const rows = await this.subscriptions.find({
            where: { user: { id: userId } },
        });
        let sent = 0, removed = 0;
        await Promise.all(rows.map(async (row) => {
            try {
                await webPush.sendNotification({
                    endpoint: row.endpoint,
                    keys: { p256dh: row.p256dh, auth: row.auth },
                }, JSON.stringify({
                    notificationId: n.id,
                    title: n.title,
                    body: n.body,
                    type: n.type || category,
                    url: n.url || "/",
                }), { TTL: 300, urgency: n.type === "MESSAGE" ? "high" : "normal" });
                row.failureCount = 0;
                row.lastSuccessAt = new Date();
                await this.subscriptions.save(row);
                sent++;
            }
            catch (error) {
                const status = Number(error.statusCode || 0);
                if (status === 404 || status === 410) {
                    await this.subscriptions.delete(row.id);
                    removed++;
                }
                else {
                    row.failureCount++;
                    await this.subscriptions.save(row);
                }
            }
        }));
        return { sent, removed };
    }
};
exports.PushService = PushService;
exports.PushService = PushService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(push_subscription_entity_1.PushSubscription)),
    __param(1, (0, typeorm_1.InjectRepository)(notification_preference_entity_1.NotificationPreference)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PushService);
//# sourceMappingURL=push.service.js.map