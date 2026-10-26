import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { ApiException } from "../../common/exceptions/api.exception";
import { AuditLog } from "../../database/entities/audit-log.entity";
import { StudentRewardLedger } from "../../database/entities/student-reward-ledger.entity";
import { Student } from "../../database/entities/student.entity";
import { User } from "../../database/entities/user.entity";
import { AuthenticatedUser } from "../auth";
import { AuthorizationService, type UserContext } from "../authorization";
import { SchoolAccessService } from "../school-access";
import { AdjustRewardDto, ReverseRewardDto } from "./rewards.dto";

const PAGE_LIMIT = 100;

@Injectable()
export class RewardsService {
  constructor(
    @InjectRepository(StudentRewardLedger) private readonly ledger: Repository<StudentRewardLedger>,
    @InjectRepository(Student) private readonly students: Repository<Student>,
    @InjectRepository(AuditLog) private readonly audit: Repository<AuditLog>,
    private readonly access: SchoolAccessService,
    private readonly authorization: AuthorizationService,
  ) {}

  private has(user: AuthenticatedUser, capability: string) {
    return user.capabilities?.includes(capability) ?? false;
  }
  private async organizations(user: AuthenticatedUser) {
    return this.access.scopedOrganizationIds(user, user.activeOrganizationId || undefined);
  }
  private async ownStudent(user: AuthenticatedUser) {
    if (!this.has(user, "rewards.self.read")) throw new ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
    const ids = await this.organizations(user);
    const student = ids.length ? await this.students.findOne({
      where: { user: { id: user.id }, organization: { id: In(ids) }, accountStatus: "active" },
      relations: { organization: true },
    }) : null;
    if (!student) throw new ApiException(404, "STUDENT_NOT_FOUND", "حساب فعال دانش‌آموز پیدا نشد.");
    return student;
  }
  private view(row: StudentRewardLedger) {
    return {
      id: row.id, studentId: row.student.id, studentName: row.student.name,
      organizationId: row.organization.id, points: row.points, reason: row.reason,
      sourceType: row.sourceType, sourceId: row.sourceId ?? null,
      contextType: row.contextType ?? null, contextId: row.contextId ?? null,
      contextName: row.contextName ?? null, requestId: row.requestId ?? null,
      awardedBy: row.awardedBy ? { id: row.awardedBy.id, name: `${row.awardedBy.firstName} ${row.awardedBy.lastName}`.trim() || row.awardedBy.username } : null,
      reversalOfId: row.reversalOf?.id ?? null, createdAt: row.createdAt.toISOString(),
    };
  }
  private async rows(where: Record<string, unknown>, page = 1, limit = 25) {
    const [items, total] = await this.ledger.findAndCount({
      where: where as never, relations: { student: true, organization: true, awardedBy: true, reversalOf: true },
      order: { createdAt: "DESC", id: "DESC" }, skip: (page - 1) * limit, take: Math.min(limit, PAGE_LIMIT),
    });
    return { items: items.map((item) => this.view(item)), page, limit: Math.min(limit, PAGE_LIMIT), total, hasNext: page * limit < total };
  }
  async mySummary(user: AuthenticatedUser) {
    const student = await this.ownStudent(user);
    const rows = await this.ledger.find({ where: { student: { id: student.id }, organization: { id: student.organization!.id } } });
    return { studentId: student.id, organizationId: student.organization!.id, points: rows.reduce((sum, row) => sum + row.points, 0) };
  }
  async myLedger(user: AuthenticatedUser, page = 1, limit = 25) {
    const student = await this.ownStudent(user);
    return this.rows({ student: { id: student.id }, organization: { id: student.organization!.id } }, page, limit);
  }
  async studentSummary(user: AuthenticatedUser, studentId: string) {
    await this.assertStudentRead(user, studentId);
    const student = await this.students.findOneOrFail({ where: { id: studentId }, relations: { organization: true } });
    const rows = await this.ledger.find({ where: { student: { id: studentId }, organization: { id: student.organization!.id } } });
    return { studentId, organizationId: student.organization!.id, points: rows.reduce((sum, row) => sum + row.points, 0) };
  }
  async studentLedger(user: AuthenticatedUser, studentId: string, page = 1, limit = 25) {
    await this.assertStudentRead(user, studentId);
    return this.rows({ student: { id: studentId } }, page, limit);
  }
  private async assertStudentRead(user: AuthenticatedUser, studentId: string) {
    if (!this.has(user, "rewards.read")) throw new ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
    if (!(await this.authorization.canAccessStudent(user as unknown as UserContext, studentId, "rewards.read")))
      throw new ApiException(403, "STUDENT_FORBIDDEN", "به این دانش‌آموز دسترسی ندارید.");
  }
  async adjust(user: AuthenticatedUser, dto: AdjustRewardDto) {
    if (!this.has(user, "rewards.adjust") || !dto.points) throw new ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
    const organization = await this.access.organizationForUser(user, dto.organizationId);
    await this.assertStudentRead({ ...user, capabilities: [...(user.capabilities ?? []), "rewards.read"] }, dto.studentId);
    const existing = await this.ledger.findOne({ where: { requestId: dto.requestId, organization: { id: organization.id }, awardedBy: { id: user.id } }, relations: { student: true, organization: true, awardedBy: true, reversalOf: true } });
    if (existing) return this.view(existing);
    const student = await this.students.findOne({ where: { id: dto.studentId, organization: { id: organization.id } } });
    if (!student) throw new ApiException(404, "STUDENT_NOT_FOUND", "دانش‌آموز پیدا نشد.");
    const saved = await this.ledger.save(this.ledger.create({ student, organization, awardedBy: { id: user.id } as User, points: dto.points, sourceType: "manual", contextType: dto.contextType ?? null, contextId: dto.contextId ?? null, contextName: dto.contextName?.trim() || null, requestId: dto.requestId, reason: dto.reason.trim() }));
    await this.audit.save({ user: { id: user.id }, organizationId: organization.id, entity: "student_reward_ledger", action: "rewards.adjusted", metadata: { rewardId: saved.id, studentId: student.id, points: saved.points, reason: saved.reason } });
    return this.view(await this.ledger.findOneOrFail({ where: { id: saved.id }, relations: { student: true, organization: true, awardedBy: true, reversalOf: true } }));
  }
  async reverse(user: AuthenticatedUser, id: string, dto: ReverseRewardDto) {
    if (!this.has(user, "rewards.reverse")) throw new ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
    const original = await this.ledger.findOne({ where: { id }, relations: { student: true, organization: true, awardedBy: true } });
    if (!original) throw new ApiException(404, "REWARD_NOT_FOUND", "تراکنش سکه پیدا نشد.");
    await this.access.organizationForUser(user, original.organization.id);
    const existing = await this.ledger.findOne({ where: { reversalOf: { id: original.id } }, relations: { student: true, organization: true, awardedBy: true, reversalOf: true } });
    if (existing) return this.view(existing);
    const saved = await this.ledger.save(this.ledger.create({ student: original.student, organization: original.organization, awardedBy: { id: user.id } as User, points: -original.points, sourceType: "reversal", sourceId: original.id, contextType: original.contextType, contextId: original.contextId, contextName: original.contextName, requestId: dto.requestId, reason: dto.reason.trim(), reversalOf: original }));
    await this.audit.save({ user: { id: user.id }, organizationId: original.organization.id, entity: "student_reward_ledger", action: "rewards.reversed", metadata: { rewardId: original.id, reversalId: saved.id, reason: saved.reason } });
    return this.view(await this.ledger.findOneOrFail({ where: { id: saved.id }, relations: { student: true, organization: true, awardedBy: true, reversalOf: true } }));
  }
  async transactions(user: AuthenticatedUser, query: { page?: number; limit?: number; from?: string; to?: string; studentId?: string; sourceType?: string }) {
    if (!this.has(user, "rewards.read")) throw new ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
    const ids = await this.organizations(user);
    const from = query.from ? new Date(query.from) : null;
    const to = query.to ? new Date(query.to) : null;
    if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime())) || (from && to && from > to))
      throw new ApiException(422, "REWARDS_DATE_RANGE", "بازهٔ زمانی معتبر نیست.");
    const rows = await this.ledger.createQueryBuilder("reward")
      .leftJoinAndSelect("reward.student", "student").leftJoinAndSelect("reward.organization", "organization")
      .leftJoinAndSelect("reward.awardedBy", "awardedBy").leftJoinAndSelect("reward.reversalOf", "reversalOf")
      .where("reward.organizationId IN (:...ids)", { ids })
      .andWhere(query.studentId ? "reward.studentId = :studentId" : "1=1", { studentId: query.studentId })
      .andWhere(query.sourceType ? "reward.sourceType = :sourceType" : "1=1", { sourceType: query.sourceType })
      .andWhere(from ? "reward.createdAt >= :from" : "1=1", { from })
      .andWhere(to ? "reward.createdAt <= :to" : "1=1", { to })
      .orderBy("reward.createdAt", "DESC").addOrderBy("reward.id", "DESC").take(500).getMany();
    const visible = (await Promise.all(rows.map(async (row) => {
      try { await this.assertStudentRead(user, row.student.id); return row; } catch (error) {
        if (error instanceof ApiException && error.getStatus() === 403) return null;
        throw error;
      }
    }))).filter((row): row is StudentRewardLedger => Boolean(row));
    const page = query.page ?? 1; const limit = Math.min(query.limit ?? 25, PAGE_LIMIT);
    return { items: visible.slice((page - 1) * limit, page * limit).map((row) => this.view(row)), page, limit, total: visible.length, hasNext: page * limit < visible.length };
  }
  async transaction(user: AuthenticatedUser, id: string) {
    if (!this.has(user, "rewards.read")) throw new ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
    const row = await this.ledger.findOne({ where: { id }, relations: { student: true, organization: true, awardedBy: true, reversalOf: true } });
    if (!row) throw new ApiException(404, "REWARD_NOT_FOUND", "تراکنش سکه پیدا نشد.");
    await this.access.organizationForUser(user, row.organization.id);
    await this.assertStudentRead(user, row.student.id);
    return this.view(row);
  }
  async recent(user: AuthenticatedUser) {
    if (!this.has(user, "rewards.read")) throw new ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
    const ids = await this.organizations(user);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const rows = await this.ledger.createQueryBuilder("reward").leftJoinAndSelect("reward.student", "student").leftJoinAndSelect("reward.organization", "organization").leftJoinAndSelect("reward.awardedBy", "awardedBy").leftJoinAndSelect("reward.reversalOf", "reversalOf").where("reward.organizationId IN (:...ids)", { ids }).andWhere("reward.createdAt >= :since", { since }).orderBy("reward.createdAt", "DESC").take(12).getMany();
    const visible = await Promise.all(rows.map(async (row) => {
      try { await this.assertStudentRead(user, row.student.id); return row; } catch (error) {
        if (error instanceof ApiException && error.getStatus() === 403) return null;
        throw error;
      }
    }));
    return visible.filter((row): row is StudentRewardLedger => Boolean(row)).map((row) => this.view(row));
  }
}
