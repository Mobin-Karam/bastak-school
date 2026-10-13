import "reflect-metadata";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { Test } from "@nestjs/testing";
import { ValidationPipe } from "@nestjs/common";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import cookie from "@fastify/cookie";
import { DataSource } from "typeorm";
import { User, UserRole } from "../src/database/entities/user.entity";
import { Session } from "../src/database/entities/session.entity";
import { Organization, OrganizationType } from "../src/database/entities/organization.entity";
import { OrganizationMembership } from "../src/database/entities/organization-membership.entity";
import { UserRoleAssignment } from "../src/database/entities/user-role-assignment.entity";
import { Role } from "../src/database/entities/role.entity";
import { Student } from "../src/database/entities/student.entity";
import { UserRelationship, RelationshipType, RelationshipStatus } from "../src/database/entities/user-relationship.entity";
import { AccountChangeRequest } from "../src/database/entities/account-change-request.entity";
import { AuthService } from "../src/modules/auth/auth.service";
import { registerHttpTelemetry } from "../src/common/observability/http-telemetry";
import { EducationClass } from "../src/database/entities/education-class.entity";
import { DormRoom } from "../src/database/entities/dorm-room.entity";
import { AttendanceSession } from "../src/database/entities/attendance-session.entity";
import { Conversation, ConversationType } from "../src/database/entities/conversation.entity";
import { ConversationMember } from "../src/database/entities/conversation-member.entity";

// Real composition, guards, controllers, services and versioned migrations. No listening
// socket and no application database: DATABASE_PATH is set before composition is imported.
describe("HTTP security boundaries (disposable migrated SQLite)", () => {
  let app: NestFastifyApplication, db: DataSource, root: string;
  let a: Organization, b: Organization, local: Student, foreign: Student;
  let admin: User, guardian: User, student: User;
  let foreignClass: EducationClass, foreignRoom: DormRoom, foreignAttendance: AttendanceSession, privateChat: Conversation;
  const previousDatabase = process.env.DATABASE_PATH;
  const previousEnv = process.env.NODE_ENV;
  type Credentials = { cookie: string; refresh: string; csrf: string; id: string };
  const password = "Disposable-test-password-42!";

  beforeAll(async () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "bastak-http-security-"));
    process.env.DATABASE_PATH = path.join(root, "test.sqlite");
    process.env.NODE_ENV = "test";
    const { AppModule } = await import("../src/app.module");
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter(), { logger: false });
    await app.register(cookie);
    registerHttpTelemetry(app.getHttpAdapter().getInstance(), () => undefined);
    app.setGlobalPrefix("api/v2", { exclude: ["health", "ready"] });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    db = app.get(DataSource);
    [a, b] = await db.getRepository(Organization).save([
      { name: "Security A", type: OrganizationType.SCHOOL }, { name: "Security B", type: OrganizationType.SCHOOL },
    ]);
    const hash = await bcrypt.hash(password, 4);
    async function account(phoneNumber: string, code: string, organization: Organization) {
      const user = await db.getRepository(User).save({ username: phoneNumber, phoneNumber, passwordHash: hash, role: code as UserRole });
      const membership = await db.getRepository(OrganizationMembership).save({ user, organization });
      const role = await db.getRepository(Role).findOneByOrFail({ code });
      await db.getRepository(UserRoleAssignment).save({ user, membership, role });
      return user;
    }
    admin = await account("09100000101", "PRINCIPAL", a);
    guardian = await account("09100000102", "GUARDIAN", a);
    student = await account("09100000103", "STUDENT", a);
    const other = await account("09100000104", "STUDENT", b);
    [local, foreign] = await db.getRepository(Student).save([
      { name: "Local", user: student, organization: a }, { name: "Foreign", user: other, organization: b },
    ]);
    await db.getRepository(UserRelationship).save({ fromUser: guardian, toStudent: local, organization: a, type: RelationshipType.GUARDIAN_OF, status: RelationshipStatus.ACTIVE });
    await db.getRepository(AccountChangeRequest).save({ user: student, organization: a, kind: "PHONE_NUMBER", requestedValue: "09100000105" });
    foreignClass = await db.getRepository(EducationClass).save({ organization: b, code: "foreign", name: "Foreign class", schoolYear: "1405-1406", gradeId: 1, educationTypeId: "school", trackId: "general" });
    foreignRoom = await db.getRepository(DormRoom).save({ organization: b, code: "foreign", name: "Foreign room", capacity: 2 });
    foreignAttendance = await db.getRepository(AttendanceSession).save({ organization: b, contextType: "class", contextId: foreignClass.id, sessionDate: new Date("2026-10-13T08:00:00Z") });
    privateChat = await db.getRepository(Conversation).save({ organization: b, type: ConversationType.GROUP, title: "Private fixture", owner: other });
    await db.getRepository(ConversationMember).save({ conversation: privateChat, user: other });
  }, 60000);

  afterAll(async () => {
    if (app) await app.close();
    if (previousDatabase === undefined) delete process.env.DATABASE_PATH;
    else process.env.DATABASE_PATH = previousDatabase;
    if (previousEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnv;
    if (root) fs.rmSync(root, { recursive: true, force: true });
  });

  async function login(user: User): Promise<Credentials> {
    const response = await app.inject({ method: "POST", url: "/api/v2/auth/login", payload: { phoneNumber: user.phoneNumber, password } });
    expect(response.statusCode).toBe(201);
    const result = response.json().data;
    const cookies = response.cookies;
    const access = cookies.find((value) => value.name === "moshaver_v2_session")!;
    const refresh = cookies.find((value) => value.name === "moshaver_v2_refresh")!;
    const session = await db.getRepository(Session).findOneByOrFail({ tokenHash: createHash("sha256").update(access.value).digest("hex") });
    return { cookie: `${access.name}=${access.value}`, refresh: `${refresh.name}=${refresh.value}`, csrf: result.csrfToken, id: session.id };
  }
  async function request(credentials: Credentials, url: string, method: "GET" | "PATCH" | "PUT" | "POST" | "DELETE" = "GET", payload?: object) {
    return app.inject({ method, url: `/api/v2${url}`, headers: { cookie: credentials.cookie, "x-csrf-token": credentials.csrf, "x-organization-id": a.id }, payload });
  }
  function forbidden(response: { statusCode: number }) { expect([403, 404]).toContain(response.statusCode); }

  it("rejects anonymous reads and cross-school profile reads/writes, leaving records unchanged", async () => {
    expect((await app.inject({ url: `/api/v2/students/${local.id}` })).statusCode).toBe(401);
    const credentials = await login(admin);
    expect((await request(credentials, `/students/${local.id}`)).statusCode).toBe(200);
    for (const suffix of ["", "/profile", "/learning", "/attendance-summary"]) forbidden(await request(credentials, `/students/${foreign.id}${suffix}`));
    forbidden(await request(credentials, `/students/${foreign.id}`, "PATCH", { name: "Unauthorized change" }));
    forbidden(await request(credentials, `/students/${foreign.id}/reset-password`, "POST", { password: "Unauthorized-change-42!" }));
    expect((await db.getRepository(Student).findOneByOrFail({ id: foreign.id })).name).toBe("Foreign");
    const account = await db.getRepository(User).findOne({ where: { id: foreign.user!.id }, select: { passwordHash: true } });
    expect(await bcrypt.compare(password, account!.passwordHash)).toBe(true);
  });

  it("rejects unrelated guardian academic/attendance reads and encouragement writes", async () => {
    const credentials = await login(guardian);
    expect((await request(credentials, `/guardian/students/${local.id}/attendance`)).statusCode).toBe(200);
    for (const resource of ["dashboard", "progress", "schedule", "attendance", "exams", "reports"]) forbidden(await request(credentials, `/guardian/students/${foreign.id}/${resource}`));
    forbidden(await request(credentials, `/guardian/students/${foreign.id}/encouragement`, "POST", { message: "Unauthorized" }));
    forbidden(await request(credentials, "/users"));
  });

  it("rejects revoked guardian relationships", async () => {
    const credentials = await login(guardian);
    await db.getRepository(UserRelationship).update({ fromUser: { id: guardian.id } }, { status: RelationshipStatus.REVOKED });
    forbidden(await request(credentials, `/guardian/students/${local.id}/attendance`));
    await db.getRepository(UserRelationship).update({ fromUser: { id: guardian.id } }, { status: RelationshipStatus.ACTIVE });
  });

  it("does not grant a guardian unrelated student chat profiles or direct conversations", async () => {
    const credentials = await login(guardian);
    expect((await request(credentials, `/chat/profiles/${student.id}`)).statusCode).toBe(200);
    forbidden(await request(credentials, `/chat/profiles/${foreign.user!.id}`));
    forbidden(await request(credentials, "/chat/conversations", "POST", { peerUserId: foreign.user!.id }));
  });

  it("does not expose credentials on self-profile or reviewer responses", async () => {
    const self = await request(await login(student), "/students/me/profile");
    const review = await request(await login(admin), "/auth/phone-change-requests");
    expect(self.statusCode).toBe(200);
    expect(review.statusCode).toBe(200);
    // Check field names, never print hashes or compare complete sensitive payloads.
    expect(self.body.includes('"passwordHash"')).toBe(false);
    expect(review.body.includes('"passwordHash"')).toBe(false);
  });

  it("does not let a guardian use another school context after membership revocation", async () => {
    const membership = await db.getRepository(OrganizationMembership).save({ user: guardian, organization: b });
    const role = await db.getRepository(Role).findOneByOrFail({ code: "GUARDIAN" });
    await db.getRepository(UserRoleAssignment).save({ user: guardian, membership, role });
    const credentials = await login(guardian);
    await db.getRepository(OrganizationMembership).update({ user: { id: guardian.id }, organization: { id: a.id } }, { status: "INACTIVE" as never });
    try {
      const response = await app.inject({ url: `/api/v2/guardian/students/${local.id}/attendance`, headers: { cookie: credentials.cookie, "x-work-role": "GUARDIAN", "x-organization-id": b.id } });
      forbidden(response);
      const list = await app.inject({ url: "/api/v2/guardian/students", headers: { cookie: credentials.cookie, "x-work-role": "GUARDIAN", "x-organization-id": b.id } });
      expect(list.statusCode).toBe(200);
      expect(list.json().data.length).toBe(0);
      const records = await app.inject({ url: "/api/v2/students", headers: { cookie: credentials.cookie, "x-work-role": "GUARDIAN", "x-organization-id": b.id } });
      expect(records.statusCode).toBe(200);
      expect(records.json().data.length).toBe(0);
      const dashboard = await app.inject({ url: "/api/v2/dashboard/home", headers: { cookie: credentials.cookie, "x-work-role": "GUARDIAN", "x-organization-id": b.id } });
      expect(dashboard.statusCode).toBe(200);
      expect(dashboard.json().data.assignedStudents).toBe(0);
    } finally {
      await db.getRepository(OrganizationMembership).update({ user: { id: guardian.id }, organization: { id: a.id } }, { status: "ACTIVE" as never });
    }
  });

  it("consumes a refresh credential once even when concurrent callers read the old session", async () => {
    const credentials = await login(admin);
    const refresh = credentials.refresh.split("=")[1];
    const auth = app.get(AuthService);
    const results = await Promise.allSettled([auth.refresh(refresh, credentials.csrf), auth.refresh(refresh, credentials.csrf)]);
    expect(results.filter((result) => result.status === "fulfilled").length).toBe(1);
    expect(results.filter((result) => result.status === "rejected").length).toBe(1);
  });

  it("requires CSRF to revoke a refresh-only session after access expiration", async () => {
    const credentials = await login(admin);
    await db.getRepository(Session).update(credentials.id, { expiresAt: new Date(0) });
    const denied = await app.inject({ method: "POST", url: "/api/v2/auth/logout", headers: { cookie: credentials.refresh } });
    expect(denied.statusCode).toBe(403);
    expect(await db.getRepository(Session).existsBy({ id: credentials.id })).toBe(true);
    const accepted = await app.inject({ method: "POST", url: "/api/v2/auth/logout", headers: { cookie: credentials.refresh, "x-csrf-token": credentials.csrf } });
    expect(accepted.statusCode).toBe(201);
    expect(await db.getRepository(Session).existsBy({ id: credentials.id })).toBe(false);
    expect((await app.inject({ method: "POST", url: "/api/v2/auth/logout" })).statusCode).toBe(201);
  });

  it("rejects missing CSRF, forged work contexts, mass assignment and foreign session revocation", async () => {
    const credentials = await login(admin);
    const other = await login(student);
    expect((await app.inject({ method: "PATCH", url: `/api/v2/students/${local.id}`, headers: { cookie: credentials.cookie }, payload: { name: "No CSRF" } })).statusCode).toBe(403);
    expect((await app.inject({ url: "/api/v2/users", headers: { cookie: credentials.cookie, "x-work-role": "PLATFORM_ADMIN", "x-organization-id": b.id } })).statusCode).toBe(403);
    expect((await request(credentials, `/students/${local.id}`, "PATCH", { roles: ["PLATFORM_ADMIN"] })).statusCode).toBe(400);
    await request(credentials, `/auth/sessions/${other.id}`, "DELETE");
    expect(await db.getRepository(Session).existsBy({ id: other.id })).toBe(true);
  });

  it("rejects foreign class/dorm roster and attendance reads/writes and private chat access", async () => {
    const credentials = await login(admin);
    for (const route of [`/classes/${foreignClass.id}/options`, `/dormitory/rooms/${foreignRoom.id}/assignments`, `/attendance/sessions/${foreignAttendance.id}`, `/attendance/sessions/${foreignAttendance.id}/history`, `/chat/conversations/${privateChat.id}/messages`]) forbidden(await request(credentials, route));
    forbidden(await request(credentials, `/classes/${foreignClass.id}`, "PATCH", { name: "Unauthorized" }));
    forbidden(await request(credentials, `/dormitory/rooms/${foreignRoom.id}/assignments`, "PUT", { studentIds: [local.id] }));
    forbidden(await request(credentials, "/attendance/bulk-mark", "POST", { organizationId: b.id, sessionId: foreignAttendance.id, entries: [{ studentId: foreign.id, status: "absent" }] }));
    forbidden(await request(credentials, `/chat/conversations/${privateChat.id}/messages`, "POST", { text: "Unauthorized" }));
    expect((await db.getRepository(EducationClass).findOneByOrFail({ id: foreignClass.id })).name).toBe("Foreign class");
  });

  it("returns safe liveness/readiness and correlates guard failures", async () => {
    expect((await app.inject({ url: "/health" })).statusCode).toBe(200);
    expect((await app.inject({ url: "/ready" })).statusCode).toBe(200);
    const response = await app.inject({ url: "/api/v2/users" });
    expect(response.statusCode).toBe(401);
    expect(response.headers["x-request-id"]).toBe(response.json().requestId);
    const query = jest.spyOn(db, "query").mockRejectedValueOnce(new Error("private-student-and-database-path"));
    try {
      const failure = await app.inject({ url: "/ready" });
      expect(failure.statusCode).toBe(503);
      expect(failure.body.includes("private-")).toBe(false);
    } finally { query.mockRestore(); }
  });
  it.each(["/notifications", "/push/status", "/dashboard/home", "/relationships"])("rejects anonymous identity-dependent endpoint %s", async (url) => {
    expect((await app.inject({ url: `/api/v2${url}` })).statusCode).toBe(401);
  });
});
