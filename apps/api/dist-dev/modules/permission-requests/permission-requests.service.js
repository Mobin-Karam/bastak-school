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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionRequestsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const api_exception_1 = require("../../common/exceptions/api.exception");
const audit_log_entity_1 = require("../../database/entities/audit-log.entity");
const organization_membership_entity_1 = require("../../database/entities/organization-membership.entity");
const permission_request_entity_1 = require("../../database/entities/permission-request.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const user_role_assignment_entity_1 = require("../../database/entities/user-role-assignment.entity");
const notifications_1 = require("../notifications");
let PermissionRequestsService = class PermissionRequestsService {
    rows;
    students;
    memberships;
    assignments;
    audit;
    notifications;
    constructor(rows, students, memberships, assignments, audit, notifications) {
        this.rows = rows;
        this.students = students;
        this.memberships = memberships;
        this.assignments = assignments;
        this.audit = audit;
        this.notifications = notifications;
    }
    async create(user, input) {
        const student = await this.students.findOne({ where: { user: { id: user.id } }, relations: { user: true } });
        if (!student)
            throw new api_exception_1.ApiException(404, "STUDENT_NOT_FOUND", "پرونده دانش‌آموز پیدا نشد.");
        const memberships = await this.memberships.find({ where: { user: { id: user.id }, status: organization_membership_entity_1.MembershipStatus.ACTIVE }, relations: { organization: true } });
        const organization = input.organizationId ? memberships.find((item) => item.organization.id === input.organizationId)?.organization : memberships.length === 1 ? memberships[0].organization : undefined;
        if (!organization)
            throw new api_exception_1.ApiException(400, "ORGANIZATION_REQUIRED", "سازمان فعال درخواست را انتخاب کنید.");
        const title = input.title?.trim();
        const details = input.details?.trim();
        const kind = input.kind?.trim() || "OTHER";
        if (!title || title.length > 160 || !details || details.length > 4000 || kind.length > 80)
            throw new api_exception_1.ApiException(400, "PERMISSION_REQUEST_INVALID", "عنوان، نوع و توضیحات درخواست را کامل وارد کنید.");
        const requestedFor = input.requestedFor ? new Date(input.requestedFor) : null;
        if (requestedFor && Number.isNaN(requestedFor.getTime()))
            throw new api_exception_1.ApiException(400, "REQUEST_DATE_INVALID", "زمان درخواست معتبر نیست.");
        const row = await this.rows.save(this.rows.create({ organization, student, kind, title, details, requestedFor }));
        await this.audit.save(this.audit.create({ user: { id: user.id }, action: "permission_request.created", entity: "permission_request", organizationId: organization.id, metadata: { id: row.id, kind } }));
        const supervisors = await this.assignments.find({ where: { membership: { organization: { id: organization.id }, status: organization_membership_entity_1.MembershipStatus.ACTIVE } }, relations: { user: true, role: { permissions: { permission: true } } } });
        const recipientIds = supervisors.filter((assignment) => assignment.role.permissions?.some((item) => item.permission.code === "permission_requests.review")).map((assignment) => assignment.user.id);
        await this.notifications.createForUsers(recipientIds, { type: "GENERAL", category: "permission-request", title: "درخواست مجوز جدید", body: `${student.name}: ${title}`, url: "/admin/permission-requests", data: { permissionRequestId: row.id } });
        return this.public(row, student.name, organization.name);
    }
    async mine(user) { const student = await this.student(user.id); return (await this.rows.find({ where: { student: { id: student.id } }, relations: { organization: true, student: true, resolvedBy: true }, order: { createdAt: "DESC" } })).map((row) => this.public(row)); }
    async list(user) { const platform = user.roles?.includes("PLATFORM_ADMIN") || user.role === "PLATFORM_ADMIN"; const organizationIds = platform ? [] : await this.reviewOrganizationIds(user.id); const where = platform ? {} : { organization: { id: (0, typeorm_2.In)(organizationIds) } }; return (await this.rows.find({ where, relations: { organization: true, student: true, resolvedBy: true }, order: { status: "ASC", createdAt: "DESC" } })).map((row) => this.public(row)); }
    async decide(user, id, status, note) { const row = await this.rows.findOne({ where: { id }, relations: { organization: true, student: { user: true } } }); if (!row)
        throw new api_exception_1.ApiException(404, "PERMISSION_REQUEST_NOT_FOUND", "درخواست پیدا نشد."); const platform = user.roles?.includes("PLATFORM_ADMIN") || user.role === "PLATFORM_ADMIN"; if (!platform && !(await this.reviewOrganizationIds(user.id)).includes(row.organization.id))
        throw new api_exception_1.ApiException(403, "ORGANIZATION_FORBIDDEN", "به این درخواست دسترسی ندارید."); if (row.status !== permission_request_entity_1.PermissionRequestStatus.PENDING)
        throw new api_exception_1.ApiException(409, "PERMISSION_REQUEST_ALREADY_RESOLVED", "این درخواست قبلا بررسی شده است."); row.status = status; row.supervisorNote = note?.trim().slice(0, 2000) || ""; row.resolvedBy = { id: user.id }; row.resolvedAt = new Date(); const saved = await this.rows.save(row); await this.audit.save(this.audit.create({ user: { id: user.id }, action: `permission_request.${status.toLowerCase()}`, entity: "permission_request", organizationId: row.organization.id, metadata: { id } })); if (row.student.user)
        await this.notifications.createForUser(row.student.user.id, { type: "GENERAL", category: "permission-request", title: status === permission_request_entity_1.PermissionRequestStatus.APPROVED ? "درخواست مجوز تأیید شد" : "درخواست مجوز رد شد", body: row.supervisorNote || row.title, url: "/permission-requests", data: { permissionRequestId: id, status } }); return this.public(saved, row.student.name, row.organization.name); }
    async student(userId) { const student = await this.students.findOne({ where: { user: { id: userId } } }); if (!student)
        throw new api_exception_1.ApiException(404, "STUDENT_NOT_FOUND", "پرونده دانش‌آموز پیدا نشد."); return student; }
    async reviewOrganizationIds(userId) { const assignments = await this.assignments.find({ where: { user: { id: userId }, membership: { status: organization_membership_entity_1.MembershipStatus.ACTIVE } }, relations: { membership: { organization: true }, role: { permissions: { permission: true } } } }); return [...new Set(assignments.filter((assignment) => assignment.membership?.organization && assignment.role.permissions?.some((item) => item.permission.code === "permission_requests.review")).map((assignment) => assignment.membership.organization.id))]; }
    public(row, studentName, organizationName) { return { id: row.id, organizationId: row.organization?.id, organizationName: organizationName || row.organization?.name, studentId: row.student?.id, studentName: studentName || row.student?.name, kind: row.kind, title: row.title, details: row.details, requestedFor: row.requestedFor?.toISOString() || null, status: row.status, supervisorNote: row.supervisorNote, resolvedAt: row.resolvedAt?.toISOString() || null, createdAt: row.createdAt?.toISOString() || null }; }
};
exports.PermissionRequestsService = PermissionRequestsService;
exports.PermissionRequestsService = PermissionRequestsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(permission_request_entity_1.PermissionRequest)),
    __param(1, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(2, (0, typeorm_1.InjectRepository)(organization_membership_entity_1.OrganizationMembership)),
    __param(3, (0, typeorm_1.InjectRepository)(user_role_assignment_entity_1.UserRoleAssignment)),
    __param(4, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository, typeorm_2.Repository, typeorm_2.Repository, typeorm_2.Repository, typeorm_2.Repository, notifications_1.NotificationsService])
], PermissionRequestsService);
//# sourceMappingURL=permission-requests.service.js.map