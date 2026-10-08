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
exports.SignupThrottleService = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const api_exception_1 = require("../../common/exceptions/api.exception");
const signup_throttle_entity_1 = require("../../database/entities/signup-throttle.entity");
let SignupThrottleService = class SignupThrottleService {
    repo;
    config;
    queue = Promise.resolve();
    constructor(repo, config) {
        this.repo = repo;
        this.config = config;
    }
    record(ip) {
        const operation = this.queue.then(() => this.recordAttempt(ip));
        this.queue = operation.catch(() => undefined);
        return operation;
    }
    async recordAttempt(ip) {
        const now = new Date();
        const windowMs = this.config.get("signupWindowMs", 60 * 60_000);
        const max = this.config.get("signupMaxAttempts", 5);
        const key = node_crypto_1.default.createHash("sha256").update(ip).digest("hex");
        if (typeof this.repo.query === "function") {
            const timestamp = now.toISOString();
            const windowStart = new Date(now.getTime() - windowMs).toISOString();
            const [row] = await this.repo.query(`INSERT INTO signup_throttles (id, "key", attempts, windowStartedAt, updatedAt)
         VALUES (?, ?, 1, ?, ?)
         ON CONFLICT("key") DO UPDATE SET
           attempts = CASE WHEN julianday(windowStartedAt) <= julianday(?) THEN 1 ELSE attempts + 1 END,
           windowStartedAt = CASE WHEN julianday(windowStartedAt) <= julianday(?) THEN excluded.windowStartedAt ELSE windowStartedAt END,
           updatedAt = excluded.updatedAt
         RETURNING attempts`, [node_crypto_1.default.randomUUID(), key, timestamp, timestamp, windowStart, windowStart]);
            if (Number(row?.attempts || 0) > max)
                throw new api_exception_1.ApiException(429, "SIGNUP_THROTTLED", "تعداد تلاش‌های ثبت‌نام زیاد است. کمی بعد دوباره تلاش کنید.");
            return;
        }
        let row = await this.repo.findOne({ where: { key } });
        if (!row || now.getTime() - row.windowStartedAt.getTime() >= windowMs)
            row = this.repo.create({ key, attempts: 0, windowStartedAt: now });
        if (row.attempts >= max)
            throw new api_exception_1.ApiException(429, "SIGNUP_THROTTLED", "تعداد تلاش‌های ثبت‌نام زیاد است. کمی بعد دوباره تلاش کنید.");
        row.attempts += 1;
        await this.repo.save(row);
    }
};
exports.SignupThrottleService = SignupThrottleService;
exports.SignupThrottleService = SignupThrottleService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(signup_throttle_entity_1.SignupThrottle)),
    __metadata("design:paramtypes", [typeorm_2.Repository, config_1.ConfigService])
], SignupThrottleService);
//# sourceMappingURL=signup-throttle.service.js.map