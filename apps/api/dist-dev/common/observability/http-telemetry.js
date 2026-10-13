"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.correlationId = correlationId;
exports.registerHttpTelemetry = registerHttpTelemetry;
const node_crypto_1 = require("node:crypto");
const node_perf_hooks_1 = require("node:perf_hooks");
function correlationId(value) {
    return typeof value === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value)
        ? value : (0, node_crypto_1.randomUUID)();
}
function registerHttpTelemetry(server, emit) {
    const started = new WeakMap();
    server.addHook("onRequest", async (request, reply) => {
        started.set(request, node_perf_hooks_1.performance.now());
        request.id = correlationId(request.headers["x-request-id"]);
        reply.header("x-request-id", request.id);
    });
    server.addHook("onResponse", async (request, reply) => {
        emit({ event: "http.request.completed", timestamp: new Date().toISOString(),
            requestId: request.id, method: request.method, route: request.routeOptions.url ?? "<unmatched>",
            status: reply.statusCode, durationMs: Math.round((node_perf_hooks_1.performance.now() - (started.get(request) ?? node_perf_hooks_1.performance.now())) * 100) / 100 });
        started.delete(request);
    });
}
//# sourceMappingURL=http-telemetry.js.map