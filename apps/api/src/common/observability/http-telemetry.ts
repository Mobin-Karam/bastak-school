import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import type { FastifyInstance, FastifyRequest } from "fastify";

export function correlationId(value: unknown): string {
  return typeof value === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value)
    ? value : randomUUID();
}

/** One completion event for every response, including errors rejected by guards.
 * Route templates provide bounded labels without names, IDs, queries or bodies. */
export function registerHttpTelemetry(server: FastifyInstance, emit: (entry: object) => void) {
  const started = new WeakMap<FastifyRequest, number>();
  server.addHook("onRequest", async (request, reply) => {
    started.set(request, performance.now());
    request.id = correlationId(request.headers["x-request-id"]);
    reply.header("x-request-id", request.id);
  });
  server.addHook("onResponse", async (request, reply) => {
    emit({ event: "http.request.completed", timestamp: new Date().toISOString(),
      requestId: request.id, method: request.method, route: request.routeOptions.url ?? "<unmatched>",
      status: reply.statusCode, durationMs: Math.round((performance.now() - (started.get(request) ?? performance.now())) * 100) / 100 });
    started.delete(request);
  });
}
