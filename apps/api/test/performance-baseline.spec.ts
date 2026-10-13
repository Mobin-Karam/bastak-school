import "reflect-metadata";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { Test } from "@nestjs/testing";
import { ValidationPipe } from "@nestjs/common";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import cookie from "@fastify/cookie";
import { DataSource } from "typeorm";
import { User, UserRole } from "../src/database/entities/user.entity";
import { Organization, OrganizationType } from "../src/database/entities/organization.entity";
import { OrganizationMembership } from "../src/database/entities/organization-membership.entity";
import { UserRoleAssignment } from "../src/database/entities/user-role-assignment.entity";
import { Role } from "../src/database/entities/role.entity";
import { Student } from "../src/database/entities/student.entity";
import { EducationClass } from "../src/database/entities/education-class.entity";
import { EducationClassEnrollment } from "../src/database/entities/education-class-enrollment.entity";
import { AttendanceSession } from "../src/database/entities/attendance-session.entity";
import { AttendanceRecord } from "../src/database/entities/attendance-record.entity";

// Opt-in, bounded, in-process load only; there is deliberately no URL setting.
const benchmark = process.env.RUN_PERFORMANCE_BASELINE === "1" ? describe : describe.skip;
benchmark("disposable API performance baseline", () => {
  let app: NestFastifyApplication, db: DataSource, root: string, organization: Organization;
  let session: AttendanceSession, students: Student[], headers: Record<string, string>;
  const previous = process.env.DATABASE_PATH, previousEnv = process.env.NODE_ENV;
  const report: Record<string, unknown> = { fixture: { students: 1000, enrolled: 30, schools: 1 }, concurrency: 4, transport: "Fastify injection; no network/TLS", observations: "synthetic fixture, not a production capacity claim" };
  let queries: number[] = [];
  beforeAll(async () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "bastak-performance-"));
    process.env.DATABASE_PATH = path.join(root, "test.sqlite");
    process.env.NODE_ENV = "test";
    const { AppModule } = await import("../src/app.module");
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter(), { logger: false });
    await app.register(cookie);
    app.setGlobalPrefix("api/v2");
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    db = app.get(DataSource);
    organization = await db.getRepository(Organization).save({ name: "Disposable performance school", type: OrganizationType.SCHOOL });
    const user = await db.getRepository(User).save({ username: "09100000201", phoneNumber: "09100000201", passwordHash: "not-used-by-fixture", role: UserRole.ORGANIZATION_ADMIN });
    const membership = await db.getRepository(OrganizationMembership).save({ user, organization });
    const role = await db.getRepository(Role).findOneByOrFail({ code: "PRINCIPAL" });
    await db.getRepository(UserRoleAssignment).save({ user, membership, role });
    students = await db.transaction(async (manager) => manager.save(Student, Array.from({ length: 1000 }, (_, index) => manager.create(Student, { name: `Synthetic student ${index}`, organization }))));
    const classroom = await db.getRepository(EducationClass).save({ organization, code: "fixture", name: "Fixture", capacity: 35, schoolYear: "1405-1406", gradeId: 1, educationTypeId: "school", trackId: "general" });
    await db.getRepository(EducationClassEnrollment).save(students.slice(0, 30).map((student) => ({ classroom, student })));
    session = await db.getRepository(AttendanceSession).save({ organization, contextType: "class", contextId: classroom.id, sessionDate: new Date("2026-10-13T08:00:00Z") });
    // Issue fixture-only random credentials without weakening real login policies.
    const { SessionCredentialService } = await import("@moshaver/cmb-auth");
    const { Session } = await import("../src/database/entities/session.entity");
    const credentials = new SessionCredentialService();
    const issued = credentials.issue();
    await db.getRepository(Session).save({ user, tokenHash: credentials.hash(issued.accessToken), refreshTokenHash: credentials.hash(issued.refreshToken), csrfToken: issued.csrfToken, expiresAt: issued.expiresAt, refreshExpiresAt: issued.refreshExpiresAt });
    headers = { cookie: `moshaver_v2_session=${issued.accessToken}`, "x-csrf-token": issued.csrfToken, "x-work-role": "PRINCIPAL", "x-organization-id": organization.id };
    db.subscribers.push({ afterQuery: (event) => { if (typeof event.executionTime === "number") queries.push(event.executionTime); } });
  }, 60000);
  afterAll(async () => {
    if (app) await app.close();
    if (root) fs.rmSync(root, { recursive: true, force: true });
    if (previous === undefined) delete process.env.DATABASE_PATH; else process.env.DATABASE_PATH = previous;
    if (previousEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previousEnv;
    const output = process.env.PERFORMANCE_REPORT_PATH;
    if (output) fs.writeFileSync(output, JSON.stringify(report, null, 2) + "\n", { mode: 0o600 });
  });
  function quantiles(values: number[]) {
    const sorted = [...values].sort((a, b) => a - b);
    const value = (fraction: number) => sorted[Math.floor((sorted.length - 1) * fraction)] ?? null;
    return { samples: sorted.length, p50Ms: value(.5), p95Ms: value(.95), p99Ms: value(.99), maxMs: sorted.at(-1) ?? null };
  }
  async function measure(name: string, url: string, payload?: object) {
    for (let i = 0; i < 5; i++) await app.inject({ method: payload ? "POST" : "GET", url, headers, payload });
    queries = [];
    const latency: number[] = [], statuses: number[] = [];
    const cpu = process.cpuUsage(), started = performance.now();
    let cursor = 0;
    await Promise.all(Array.from({ length: 4 }, async () => {
      while (cursor++ < 40) {
        const start = performance.now();
        const response = await app.inject({ method: payload ? "POST" : "GET", url, headers, payload });
        latency.push(Math.round((performance.now() - start) * 100) / 100);
        statuses.push(response.statusCode);
      }
    }));
    const elapsed = performance.now() - started, usage = process.cpuUsage(cpu);
    report[name] = { latency: quantiles(latency), queries: quantiles(queries), queriesPerRequest: queries.length / latency.length,
      serverErrorRate: statuses.filter((status) => status >= 500).length / statuses.length,
      statuses: Object.fromEntries([...new Set(statuses)].map((status) => [status, statuses.filter((value) => value === status).length])),
      elapsedMs: Math.round(elapsed), cpuMs: (usage.user + usage.system) / 1000, rssBytes: process.memoryUsage().rss };
    expect(statuses.every((status) => status >= 200 && status < 300)).toBe(true);
  }
  it("measures 1000-student listings", async () => { await measure("studentListings", "/api/v2/students"); });
  it("measures scoped dashboards", async () => { await measure("dashboard", "/api/v2/dashboard/home"); });
  it("measures concurrent attendance submissions and verifies unique records", async () => {
    await measure("attendance", "/api/v2/attendance/bulk-mark", { organizationId: organization.id, sessionId: session.id, entries: students.slice(0, 30).map((student) => ({ studentId: student.id, status: "present" })) });
    expect(await db.getRepository(AttendanceRecord).countBy({ session: { id: session.id } })).toBe(30);
  });
});
