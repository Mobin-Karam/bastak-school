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
exports.LoginThrottleService = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const api_exception_1 = require("../../common/exceptions/api.exception");
const login_throttle_entity_1 = require("../../database/entities/login-throttle.entity");
let LoginThrottleService = class LoginThrottleService {
    repo;
    config;
    failureQueue = Promise.resolve();
    constructor(repo, config) {
        this.repo = repo;
        this.config = config;
    }
    keys(ip, identifier) { const normalized = identifier.trim().toLowerCase(); const hash = (value) => node_crypto_1.default.createHash("sha256").update(value).digest("hex"); return [`ip:${hash(ip)}`, `id:${hash(normalized)}`, `pair:${hash(`${ip}\0${normalized}`)}`]; }
    async assertAllowed(ip, identifier) { const now = new Date(); const rows = await this.repo.find({ where: { key: (0, typeorm_2.In)(this.keys(ip, identifier)) } }); if (rows.some((row) => row.lockedUntil && row.lockedUntil > now))
        throw new api_exception_1.ApiException(429, "LOGIN_THROTTLED", "ورود موقتاً امکان‌پذیر نیست. کمی بعد دوباره تلاش کنید."); }
    async failure(ip, identifier) {
        const operation = this.failureQueue.then(() => this.recordFailure(ip, identifier));
        this.failureQueue = operation.catch(() => undefined);
        return operation;
    }
    async recordFailure(ip, identifier) {
        const now = new Date();
        const windowMs = this.config.get("loginAttemptWindowMs", 15 * 60_000);
        const lockMs = this.config.get("loginLockMs", 15 * 60_000);
        const max = this.config.get("loginMaxAttempts", 8);
        for (const key of this.keys(ip, identifier)) {
            if (typeof this.repo.query === "function") {
                const id = node_crypto_1.default.randomUUID();
                const timestamp = now.toISOString();
                const windowStart = new Date(now.getTime() - windowMs).toISOString();
                const lockedUntil = new Date(now.getTime() + lockMs).toISOString();
                await this.repo.query(`INSERT INTO login_throttles (id, "key", attempts, windowStartedAt, lockedUntil, updatedAt)
           VALUES (?, ?, 1, ?, CASE WHEN 1 >= ? THEN ? ELSE NULL END, ?)
           ON CONFLICT("key") DO UPDATE SET
             attempts = CASE WHEN julianday(windowStartedAt) <= julianday(?) THEN 1 ELSE attempts + 1 END,
             windowStartedAt = CASE WHEN julianday(windowStartedAt) <= julianday(?) THEN excluded.windowStartedAt ELSE windowStartedAt END,
             lockedUntil = CASE
               WHEN julianday(windowStartedAt) <= julianday(?) THEN CASE WHEN 1 >= ? THEN ? ELSE NULL END
               WHEN attempts + 1 >= ? THEN ?
               ELSE lockedUntil
             END,
             updatedAt = excluded.updatedAt`, [id, key, timestamp, max, lockedUntil, timestamp, windowStart, windowStart, windowStart, max, lockedUntil, max, lockedUntil]);
                continue;
            }
            let row = await this.repo.findOne({ where: { key } });
            if (!row || now.getTime() - row.windowStartedAt.getTime() > windowMs)
                row = this.repo.create({ key, attempts: 0, windowStartedAt: now, lockedUntil: null });
            row.attempts += 1;
            if (row.attempts >= max)
                row.lockedUntil = new Date(now.getTime() + lockMs);
            await this.repo.save(row);
        }
    }
    async success(ip, identifier) { await this.repo.delete({ key: (0, typeorm_2.In)(this.keys(ip, identifier).slice(1)) }); }
};
exports.LoginThrottleService = LoginThrottleService;
exports.LoginThrottleService = LoginThrottleService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(login_throttle_entity_1.LoginThrottle)),
    __metadata("design:paramtypes", [typeorm_2.Repository, config_1.ConfigService])
], LoginThrottleService);
//# sourceMappingURL=login-throttle.service.js.map