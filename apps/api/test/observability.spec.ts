import Fastify from "fastify";
import { correlationId, registerHttpTelemetry } from "../src/common/observability/http-telemetry";
import { SafeDatabaseLogger } from "../src/database/safe-database-logger";

describe("safe observability", () => {
  it("correlates success and failure without logging bodies, query strings or resource IDs", async () => {
    const events: object[] = [];
    const server = Fastify();
    registerHttpTelemetry(server, (event) => events.push(event));
    server.post("/students/:id", async (_request, reply) => reply.code(403).send({ ok: false }));
    const requestId = "38a5c1c5-d7ed-4f03-a1de-811e975b321e";
    const response = await server.inject({ method: "POST", url: "/students/private-student?phoneNumber=private-phone", headers: { "x-request-id": requestId, cookie: "private-session-token" }, payload: { password: "private-password", nationalCode: "private-national-code" } });
    expect(response.headers["x-request-id"]).toBe(requestId);
    expect(events).toEqual([expect.objectContaining({ event: "http.request.completed", requestId, route: "/students/:id", status: 403, durationMs: expect.any(Number) })]);
    expect(JSON.stringify(events).includes("private-")).toBe(false);
    expect(correlationId("bad\nheader")).toMatch(/^[a-f0-9-]{36}$/);
    await server.close();
  });
  it("never records SQL, parameters or driver exception messages", () => {
    const events: object[] = [];
    const logger = new SafeDatabaseLogger((event) => events.push(event));
    logger.logQuerySlow(123);
    logger.logQueryError();
    expect(events).toEqual([expect.objectContaining({ event: "db.query.slow", durationMs: 123 }), expect.objectContaining({ event: "db.query.error" })]);
    expect(events.flatMap((entry) => Object.keys(entry))).not.toContain("query");
  });
});
