"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const platform_fastify_1 = require("@nestjs/platform-fastify");
const cookie_1 = __importDefault(require("@fastify/cookie"));
const cors_1 = __importDefault(require("@fastify/cors"));
const helmet_1 = __importDefault(require("@fastify/helmet"));
const app_module_1 = require("./app.module");
const swagger_1 = require("@nestjs/swagger");
const http_telemetry_1 = require("./common/observability/http-telemetry");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_fastify_1.FastifyAdapter({
        logger: false,
        bodyLimit: Number(process.env.MAX_BODY_SIZE || 2 * 1024 * 1024),
        trustProxy: process.env.TRUST_PROXY === "1",
    }));
    const config = app.get(config_1.ConfigService);
    (0, http_telemetry_1.registerHttpTelemetry)(app.getHttpAdapter().getInstance(), (entry) => console.log(JSON.stringify(entry)));
    const corsOrigins = config.get("corsOrigins") || [];
    await app.register(helmet_1.default);
    await app.register(cookie_1.default);
    await app.register(cors_1.default, { origin: corsOrigins, credentials: true });
    app.setGlobalPrefix("api/v2", { exclude: ["health", "ready"] });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const openApi = new swagger_1.DocumentBuilder()
        .setTitle("Zanin API v2")
        .setDescription("User-scoped Zanin v2 API. Protected operations use short-lived HttpOnly access cookies, rotating HttpOnly refresh cookies, and a CSRF header for mutations. Capability requirements are enforced server-side.")
        .setVersion("2.0.0")
        .addCookieAuth(config.get("cookieName", "zanin_v2_session"))
        .addApiKey({
        type: "apiKey",
        in: "header",
        name: "X-CSRF-Token",
        description: "Required for authenticated state-changing requests.",
    }, "csrf")
        .addServer("/api/v2")
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, openApi, {
        operationIdFactory: (controller, method) => `${controller}.${method}`,
    });
    document.components = document.components || {};
    document.components.schemas = {
        ...document.components.schemas,
        ApiError: {
            type: "object",
            required: ["ok", "error"],
            properties: {
                ok: { type: "boolean", example: false },
                error: {
                    type: "object",
                    required: ["code", "message"],
                    properties: {
                        code: { type: "string", example: "FORBIDDEN" },
                        message: { type: "string" },
                        details: { type: "object", additionalProperties: true },
                    },
                },
                requestId: { type: "string" },
            },
        },
        CursorPage: {
            type: "object",
            required: ["items", "nextCursor"],
            properties: {
                items: { type: "array", items: {} },
                nextCursor: {
                    type: "string",
                    nullable: true,
                    description: "Opaque cursor; clients must not parse it.",
                },
            },
        },
    };
    swagger_1.SwaggerModule.setup("api/v2/docs", app, document, {
        jsonDocumentUrl: "/api/v2/openapi.json",
    });
    const server = await app.listen(config.get("port") || 4000, "0.0.0.0");
    const shutdown = async () => {
        await app.close();
        process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
    return server;
}
void bootstrap();
//# sourceMappingURL=main.js.map