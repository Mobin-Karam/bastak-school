"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
let LoggingInterceptor = class LoggingInterceptor {
    logger = new common_1.Logger("HTTP");
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const started = Date.now();
        const requestId = request.headers["x-request-id"] || crypto.randomUUID();
        request.requestId = requestId;
        const isEventStream = String(request.url).split("?")[0].endsWith("/events");
        return next.handle().pipe((0, rxjs_1.tap)({
            next: () => {
                if (isEventStream)
                    return;
                this.logger.log(JSON.stringify({
                    requestId,
                    method: request.method,
                    path: request.url,
                    durationMs: Date.now() - started,
                }));
            },
            error: (error) => {
                const status = typeof error?.getStatus === "function" ? error.getStatus() : Number(error?.status || error?.statusCode || 500);
                const entry = JSON.stringify({ requestId, method: request.method, path: request.url, status, durationMs: Date.now() - started, error: error?.message });
                if (status >= 500)
                    this.logger.error(entry);
                else
                    this.logger.warn(entry);
            },
        }));
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = __decorate([
    (0, common_1.Injectable)()
], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map