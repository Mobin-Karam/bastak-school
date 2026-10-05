import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { ApiException } from "../../common/exceptions/api.exception";
import { AuditLog } from "../../database/entities/audit-log.entity";
import { MembershipStatus, OrganizationMembership } from "../../database/entities/organization-membership.entity";
import { PermissionRequest, PermissionRequestStatus } from "../../database/entities/permission-request.entity";
import { Student } from "../../database/entities/student.entity";
import { UserRoleAssignment } from "../../database/entities/user-role-assignment.entity";
import { AuthenticatedUser } from "../auth";
import { NotificationsService } from "../notifications/notifications.service";

type CreateInput = { organizationId?: string; kind?: string; title?: string; details?: string; requestedFor?: string };
@Injectable()
export class PermissionRequestsService {
  constructor(@InjectRepository(PermissionRequest) private rows: Repository<PermissionRequest>, @InjectRepository(Student) private students: Repository<Student>, @InjectRepository(OrganizationMembership) private memberships: Repository<OrganizationMembership>, @InjectRepository(UserRoleAssignment) private assignments: Repository<UserRoleAssignment>, @InjectRepository(AuditLog) private audit: Repository<AuditLog>, private notifications: NotificationsService) {}
  async create(user: AuthenticatedUser, input: CreateInput) {
    const student = await this.students.findOne({ where: { user: { id: user.id } }, relations: { user: true } });
    if (!student) throw new ApiException(404, "STUDENT_NOT_FOUND", "پرونده دانش‌آموز پیدا نشد.");
    const memberships = await this.memberships.find({ where: { user: { id: user.id }, status: MembershipStatus.ACTIVE }, relations: { organization: true } });
    const organization = input.organizationId ? memberships.find((item) => item.organization.id === input.organizationId)?.organization : memberships.length === 1 ? memberships[0].organization : undefined;
    if (!organization) throw new ApiException(400, "ORGANIZATION_REQUIRED", "سازمان فعال درخواست را انتخاب کنید.");
    const title = input.title?.trim(); const details = input.details?.trim(); const kind = input.kind?.trim() || "OTHER";
    if (!title || title.length > 160 || !details || details.length > 4000 || kind.length > 80) throw new ApiException(400, "PERMISSION_REQUEST_INVALID", "عنوان، نوع و توضیحات درخواست را کامل وارد کنید.");
    const requestedFor = input.requestedFor ? new Date(input.requestedFor) : null;
    if (requestedFor && Number.isNaN(requestedFor.getTime())) throw new ApiException(400, "REQUEST_DATE_INVALID", "زمان درخواست معتبر نیست.");
    const row = await this.rows.save(this.rows.create({ organization, student, kind, title, details, requestedFor }));
    await this.audit.save(this.audit.create({ user: { id: user.id } as any, action: "permission_request.created", entity: "permission_request", organizationId: organization.id, metadata: { id: row.id, kind } }));
    const supervisors = await this.assignments.find({ where: { membership: { organization: { id: organization.id }, status: MembershipStatus.ACTIVE } }, relations: { user: true, role: { permissions: { permission: true } } } });
    const recipientIds = supervisors.filter((assignment) => assignment.role.permissions?.some((item) => item.permission.code === "permission_requests.review")).map((assignment) => assignment.user.id);
    await this.notifications.createForUsers(recipientIds, { type: "GENERAL", category: "permission-request", title: "درخواست مجوز جدید", body: `${student.name}: ${title}`, url: "/admin/permission-requests", data: { permissionRequestId: row.id } });
    return this.public(row, student.name, organization.name);
  }
  async mine(user: AuthenticatedUser) { const student = await this.student(user.id); return (await this.rows.find({ where: { student: { id: student.id } }, relations: { organization: true, student: true, resolvedBy: true }, order: { createdAt: "DESC" } })).map((row) => this.public(row)); }
  async list(user: AuthenticatedUser) { const platform = user.roles?.includes("PLATFORM_ADMIN") || user.role === "PLATFORM_ADMIN"; const organizationIds = platform ? [] : await this.reviewOrganizationIds(user.id); const where = platform ? {} : { organization: { id: In(organizationIds) } }; return (await this.rows.find({ where, relations: { organization: true, student: true, resolvedBy: true }, order: { status: "ASC", createdAt: "DESC" } })).map((row) => this.public(row)); }
  async decide(user: AuthenticatedUser, id: string, status: PermissionRequestStatus.APPROVED | PermissionRequestStatus.REJECTED, note?: string) { const row = await this.rows.findOne({ where: { id }, relations: { organization: true, student: { user: true } } }); if (!row) throw new ApiException(404, "PERMISSION_REQUEST_NOT_FOUND", "درخواست پیدا نشد."); const platform = user.roles?.includes("PLATFORM_ADMIN") || user.role === "PLATFORM_ADMIN"; if (!platform && !(await this.reviewOrganizationIds(user.id)).includes(row.organization.id)) throw new ApiException(403, "ORGANIZATION_FORBIDDEN", "به این درخواست دسترسی ندارید."); if (row.status !== PermissionRequestStatus.PENDING) throw new ApiException(409, "PERMISSION_REQUEST_ALREADY_RESOLVED", "این درخواست قبلا بررسی شده است."); row.status = status; row.supervisorNote = note?.trim().slice(0, 2000) || ""; row.resolvedBy = { id: user.id } as any; row.resolvedAt = new Date(); const saved = await this.rows.save(row); await this.audit.save(this.audit.create({ user: { id: user.id } as any, action: `permission_request.${status.toLowerCase()}`, entity: "permission_request", organizationId: row.organization.id, metadata: { id } })); if (row.student.user) await this.notifications.createForUser(row.student.user.id, { type: "GENERAL", category: "permission-request", title: status === PermissionRequestStatus.APPROVED ? "درخواست مجوز تأیید شد" : "درخواست مجوز رد شد", body: row.supervisorNote || row.title, url: "/permission-requests", data: { permissionRequestId: id, status } }); return this.public(saved, row.student.name, row.organization.name); }
  private async student(userId: string) { const student = await this.students.findOne({ where: { user: { id: userId } } }); if (!student) throw new ApiException(404, "STUDENT_NOT_FOUND", "پرونده دانش‌آموز پیدا نشد."); return student; }
  private async reviewOrganizationIds(userId: string) { const assignments = await this.assignments.find({ where: { user: { id: userId }, membership: { status: MembershipStatus.ACTIVE } }, relations: { membership: { organization: true }, role: { permissions: { permission: true } } } }); return [...new Set(assignments.filter((assignment) => assignment.membership?.organization && assignment.role.permissions?.some((item) => item.permission.code === "permission_requests.review")).map((assignment) => assignment.membership!.organization.id))]; }
  private public(row: PermissionRequest, studentName?: string, organizationName?: string) { return { id: row.id, organizationId: row.organization?.id, organizationName: organizationName || row.organization?.name, studentId: row.student?.id, studentName: studentName || row.student?.name, kind: row.kind, title: row.title, details: row.details, requestedFor: row.requestedFor?.toISOString() || null, status: row.status, supervisorNote: row.supervisorNote, resolvedAt: row.resolvedAt?.toISOString() || null, createdAt: row.createdAt?.toISOString() || null }; }
}
