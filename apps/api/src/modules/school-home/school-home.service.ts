import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, Repository } from "typeorm";
import { ApiException } from "../../common/exceptions/api.exception";
import { EducationClass } from "../../database/entities/education-class.entity";
import { EducationClassEnrollment } from "../../database/entities/education-class-enrollment.entity";
import { Organization } from "../../database/entities/organization.entity";
import { SchoolAnnouncement } from "../../database/entities/school-announcement.entity";
import { SchoolAnnouncementRecipient } from "../../database/entities/school-announcement-recipient.entity";
import {
  OrganizationMembership,
  MembershipStatus,
} from "../../database/entities/organization-membership.entity";
import { User } from "../../database/entities/user.entity";
import { SchoolPrayerTime } from "../../database/entities/school-prayer-time.entity";
import { UserRelationship } from "../../database/entities/user-relationship.entity";
import { AuthenticatedUser } from "../auth";
import { AuthorizationService, UserContext } from "../authorization";
import { NotificationsService } from "../notifications";
import {
  SavePrayerTimeDto,
  SaveSchoolAnnouncementDto,
} from "./school-home.dto";

type SchoolAnnouncementWithRecipients = SchoolAnnouncement & {
  recipients?: SchoolAnnouncementRecipient[];
};

@Injectable()
export class SchoolHomeService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizations: Repository<Organization>,
    @InjectRepository(SchoolPrayerTime)
    private readonly prayers: Repository<SchoolPrayerTime>,
    @InjectRepository(SchoolAnnouncement)
    private readonly announcementsRepo: Repository<SchoolAnnouncement>,
    @InjectRepository(SchoolAnnouncementRecipient)
    private readonly recipients: Repository<SchoolAnnouncementRecipient>,
    @InjectRepository(OrganizationMembership)
    private readonly memberships: Repository<OrganizationMembership>,
    @InjectRepository(EducationClass)
    private readonly classes: Repository<EducationClass>,
    @InjectRepository(EducationClassEnrollment)
    private readonly enrollments: Repository<EducationClassEnrollment>,
    @InjectRepository(UserRelationship)
    private readonly relationships: Repository<UserRelationship>,
    private readonly authorization: AuthorizationService,
    private readonly notifications: NotificationsService,
  ) {}

  async prayerTimes(
    user: AuthenticatedUser,
    organizationId?: string,
    date?: string,
  ) {
    const organization = await this.scopedOrganization(
      user,
      organizationId,
      "prayer_times.read",
    );
    // `date=` is an intentional request for the school-wide default. It must
    // not be replaced by today's override when managers open Settings.
    const isDefault = date === "";
    const day = isDefault
      ? ""
      : (date ?? new Date().toISOString().slice(0, 10));
    const row = await this.prayers.findOne({
      where: { organization: { id: organization.id }, date: day },
    });
    const fallback =
      !row && !isDefault
        ? await this.prayers.findOne({
            where: { organization: { id: organization.id }, date: "" },
          })
        : null;
    const resolved = row ?? fallback;
    return {
      organizationId: organization.id,
      date: day,
      times: resolved ? this.prayerView(resolved) : null,
    };
  }

  async savePrayerTimes(
    user: AuthenticatedUser,
    organizationId: string,
    dto: SavePrayerTimeDto,
  ) {
    const organization = await this.scopedOrganization(
      user,
      organizationId,
      "prayer_times.manage",
    );
    const date = dto.date ?? "";
    let row = await this.prayers.findOne({
      where: { organization: { id: organization.id }, date },
    });
    if (!row) row = this.prayers.create({ organization, date });
    Object.assign(row, {
      fajr: dto.fajr,
      sunrise: dto.sunrise,
      dhuhr: dto.dhuhr,
      asr: dto.asr,
      maghrib: dto.maghrib,
      isha: dto.isha,
      source: dto.source?.trim() || "",
    });
    return this.prayerView(await this.prayers.save(row));
  }

  async deletePrayerTimes(
    user: AuthenticatedUser,
    organizationId: string,
    date?: string,
  ) {
    const organization = await this.scopedOrganization(
      user,
      organizationId,
      "prayer_times.manage",
    );
    const row = await this.prayers.findOne({
      where: { organization: { id: organization.id }, date: date ?? "" },
    });
    if (!row) return { deleted: false };
    await this.prayers.remove(row);
    return { deleted: true };
  }

  async announcements(user: AuthenticatedUser, organizationId?: string) {
    const organization = await this.scopedOrganization(
      user,
      organizationId,
      "announcements.read",
    );
    const context = this.context(user);
    const now = new Date();
    const query = this.announcementsRepo
      .createQueryBuilder("announcement")
      .leftJoinAndSelect("announcement.classroom", "classroom")
      .leftJoinAndMapMany(
        "announcement.recipients",
        SchoolAnnouncementRecipient,
        "recipient",
        "recipient.announcementId = announcement.id",
      )
      .leftJoinAndSelect("recipient.user", "recipientUser")
      .where("announcement.organizationId = :organizationId", {
        organizationId: organization.id,
      })
      .andWhere("announcement.status = 'ACTIVE'")
      .andWhere(
        new Brackets((qb) =>
          qb
            .where("announcement.expiresAt IS NULL")
            .orWhere("announcement.expiresAt > :now", { now }),
        ),
      );
    if (!this.isManager(context)) {
      const classIds = await this.audienceClassIds(user, organization.id);
      query.andWhere(
        new Brackets((qb) => {
          if (this.isStudentAudience(context)) {
            qb.where("announcement.audience IN ('ALL', 'STUDENTS')");
            qb.orWhere(
              "announcement.audience = 'USERS' AND recipient.userId = :userId",
              {
                userId: user.id,
              },
            );
            if (classIds.length)
              qb.orWhere(
                "announcement.audience = 'CLASS' AND announcement.classroomId IN (:...classIds)",
                { classIds },
              );
            return;
          }
          qb.where("announcement.audience IN ('ALL', 'STAFF')").orWhere(
            "announcement.audience = 'USERS' AND recipient.userId = :userId",
            {
              userId: user.id,
            },
          );
        }),
      );
    } else {
      query.andWhere(
        new Brackets((qb) =>
          qb
            .where("announcement.audience != 'USERS'")
            .orWhere("recipient.userId = :userId", {
              userId: user.id,
            }),
        ),
      );
    }
    const rows = await query
      .orderBy("announcement.publishedAt", "DESC")
      .addOrderBy("announcement.createdAt", "DESC")
      .getMany();
    return rows.map((row) => this.announcementView(row));
  }

  async announcementRecipients(
    user: AuthenticatedUser,
    organizationId: string,
    query?: string,
  ) {
    await this.scopedOrganization(user, organizationId, "announcements.manage");
    const needle = query?.trim().toLowerCase();
    const [rows, roleRows] = await Promise.all([
      this.memberships.find({
        where: {
          organization: { id: organizationId },
          status: MembershipStatus.ACTIVE,
        },
        relations: { user: true, roleAssignments: { role: true } },
        take: 100,
      }),
      this.memberships
        .createQueryBuilder("membership")
        .innerJoin("membership.roleAssignments", "assignment")
        .innerJoin("assignment.role", "role")
        .select("role.code", "code")
        .where("membership.organizationId = :organizationId", {
          organizationId,
        })
        .andWhere("membership.status = :status", {
          status: MembershipStatus.ACTIVE,
        })
        .distinct(true)
        .getRawMany<{ code: string }>(),
    ]);
    const roleCodesByUser = new Map(
      rows.map((membership) => [
        membership.user.id,
        membership.roleAssignments.map((assignment) => assignment.role.code),
      ]),
    );
    const members = rows
      .map(({ user: member }) => ({
        id: member.id,
        name:
          `${member.firstName} ${member.lastName}`.trim() || member.username,
        username: member.username,
        roleCodes: roleCodesByUser.get(member.id) ?? [],
      }))
      .filter(
        (member) =>
          !needle ||
          `${member.name} ${member.username}`.toLowerCase().includes(needle),
      );
    return {
      members,
      roles: roleRows.map((role) => role.code).sort(),
    };
  }

  async saveAnnouncement(
    user: AuthenticatedUser,
    organizationId: string,
    dto: SaveSchoolAnnouncementDto,
  ) {
    const organization = await this.scopedOrganization(
      user,
      organizationId,
      "announcements.manage",
    );
    const classroom = await this.classroomForAnnouncement(
      organization.id,
      dto.audience,
      dto.classroomId,
    );
    const status = dto.status ?? "ACTIVE";
    const publishedAt = status === "ACTIVE" ? new Date() : null;
    const recipientIds = await this.recipientIds(organization.id, dto);
    const media = this.media(dto);
    const row = this.announcementsRepo.create({
      organization,
      classroom,
      audience: dto.audience,
      title: dto.title.trim(),
      body: dto.body.trim(),
      category: dto.category?.trim() || "general",
      linkUrl: this.optionalUrl(dto.linkUrl),
      ...media,
      status,
      publishedAt,
      // School notices are intentionally short-lived. Client-supplied expiry
      // is ignored so a manager cannot accidentally publish a permanent notice.
      expiresAt: publishedAt
        ? new Date(publishedAt.getTime() + 24 * 60 * 60 * 1000)
        : null,
      createdBy: { id: user.id } as any,
    });
    const saved = await this.announcementsRepo.save(row);
    await this.setRecipients(saved, recipientIds);
    if (status === "ACTIVE" && recipientIds.length) {
      await this.notifications.createForUsers(recipientIds, {
        type: "ANNOUNCEMENT",
        title: saved.title,
        body: saved.body,
        category: "announcement",
        url: "/admin/announcements",
      });
    }
    return this.announcementView(
      await this.announcementWithRecipients(saved.id),
    );
  }

  async updateAnnouncement(
    user: AuthenticatedUser,
    id: string,
    dto: SaveSchoolAnnouncementDto,
  ) {
    const row = await this.announcementsRepo.findOne({
      where: { id },
      relations: { organization: true },
    });
    if (!row)
      throw new ApiException(404, "ANNOUNCEMENT_NOT_FOUND", "پیام پیدا نشد.");
    await this.scopedOrganization(
      user,
      row.organization.id,
      "announcements.manage",
    );
    const classroom = await this.classroomForAnnouncement(
      row.organization.id,
      dto.audience,
      dto.classroomId,
    );
    const status = dto.status ?? row.status;
    const recipientIds = await this.recipientIds(row.organization.id, dto);
    const media = this.media(dto);
    const publishedAt =
      status === "ACTIVE" ? (row.publishedAt ?? new Date()) : null;
    Object.assign(row, {
      classroom,
      audience: dto.audience,
      title: dto.title.trim(),
      body: dto.body.trim(),
      category: dto.category?.trim() || row.category,
      linkUrl:
        dto.linkUrl === undefined
          ? (row.linkUrl ?? null)
          : this.optionalUrl(dto.linkUrl),
      ...(dto.mediaUrl === undefined
        ? { mediaUrl: row.mediaUrl ?? null, mediaType: row.mediaType ?? null }
        : media),
      status,
      publishedAt,
      expiresAt: publishedAt
        ? (row.expiresAt ??
          new Date(publishedAt.getTime() + 24 * 60 * 60 * 1000))
        : null,
    });
    const saved = await this.announcementsRepo.save(row);
    await this.setRecipients(saved, recipientIds);
    return this.announcementView(
      await this.announcementWithRecipients(saved.id),
    );
  }

  private async scopedOrganization(
    user: AuthenticatedUser,
    requestedId: string | undefined,
    capability: string,
  ) {
    const context = this.context(user);
    this.authorization.requireCapability(context, capability);
    const organizationId = requestedId ?? context.organizationIds[0];
    if (!organizationId)
      throw new ApiException(
        422,
        "ORGANIZATION_REQUIRED",
        "مدرسه فعال را انتخاب کنید.",
      );
    if (
      !this.authorization.canAccessOrganization(
        context,
        organizationId,
        capability,
      )
    )
      throw new ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
    const organization = await this.organizations.findOneBy({
      id: organizationId,
    });
    if (!organization)
      throw new ApiException(404, "ORGANIZATION_NOT_FOUND", "مدرسه پیدا نشد.");
    return organization;
  }

  private async classroomForAnnouncement(
    organizationId: string,
    audience: string,
    classroomId?: string,
  ) {
    if (audience !== "CLASS") return null;
    if (!classroomId)
      throw new ApiException(
        422,
        "ANNOUNCEMENT_CLASS_REQUIRED",
        "برای پیام کلاسی، کلاس لازم است.",
      );
    const classroom = await this.classes.findOne({
      where: { id: classroomId, organization: { id: organizationId } },
    });
    if (!classroom)
      throw new ApiException(404, "CLASS_NOT_FOUND", "کلاس پیدا نشد.");
    return classroom;
  }

  private async audienceClassIds(
    user: AuthenticatedUser,
    organizationId: string,
  ) {
    const context = this.context(user);
    if (context.roles.includes("STUDENT")) {
      const rows = await this.enrollments.find({
        where: {
          student: { user: { id: user.id } },
          classroom: { organization: { id: organizationId } },
        },
        relations: { classroom: true },
      });
      return rows.map((row) => row.classroom.id);
    }
    if (context.roles.includes("GUARDIAN")) {
      const rows = await this.enrollments
        .createQueryBuilder("enrollment")
        .innerJoin(
          UserRelationship,
          "relationship",
          "relationship.toStudentId = enrollment.studentId AND relationship.fromUserId = :userId AND relationship.status = 'ACTIVE' AND relationship.type = 'GUARDIAN_OF'",
          { userId: user.id },
        )
        .where("enrollment.classroomId IS NOT NULL")
        .getMany();
      return [
        ...new Set(rows.map((row) => (row as any).classroomId).filter(Boolean)),
      ];
    }
    return [];
  }

  private isManager(context: UserContext) {
    return context.roles.some((role) =>
      [
        "PLATFORM_ADMIN",
        "ORGANIZATION_ADMIN",
        "PRINCIPAL",
        "SCHOOL_SUPERVISOR",
      ].includes(role),
    );
  }
  private isStudentAudience(context: UserContext) {
    return context.roles.some((role) => ["STUDENT", "GUARDIAN"].includes(role));
  }
  private context(user: AuthenticatedUser): UserContext {
    return {
      ...user,
      roles: user.roles ?? [user.role],
      capabilities: user.capabilities ?? [],
      membershipIds: user.membershipIds ?? [],
      organizationIds: user.organizationIds ?? [],
    };
  }
  private prayerView(row: SchoolPrayerTime) {
    return {
      id: row.id,
      date: row.date,
      fajr: row.fajr,
      sunrise: row.sunrise,
      dhuhr: row.dhuhr,
      asr: row.asr,
      maghrib: row.maghrib,
      isha: row.isha,
      source: row.source,
      updatedAt: row.updatedAt,
    };
  }
  private announcementView(row: SchoolAnnouncementWithRecipients) {
    return {
      id: row.id,
      organizationId: row.organization?.id,
      audience: row.audience,
      classroomId: row.classroom?.id ?? null,
      title: row.title,
      body: row.body,
      category: row.category,
      linkUrl: row.linkUrl ?? null,
      mediaUrl: row.mediaUrl ?? null,
      mediaType: row.mediaType ?? null,
      recipientIds: row.recipients?.map((recipient) => recipient.user.id) ?? [],
      status: row.status,
      publishedAt: row.publishedAt,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
    };
  }

  private async announcementWithRecipients(
    id: string,
  ): Promise<SchoolAnnouncementWithRecipients> {
    const [announcement, recipients] = await Promise.all([
      this.announcementsRepo.findOneOrFail({ where: { id } }),
      this.recipients.find({
        where: { announcement: { id } },
        relations: { user: true },
      }),
    ]);
    return Object.assign(announcement, { recipients });
  }

  private optionalUrl(value?: string) {
    if (!value?.trim()) return null;
    try {
      const url = new URL(value);
      if (url.protocol !== "https:") throw new Error();
      return url.toString();
    } catch {
      throw new ApiException(
        400,
        "INVALID_LINK",
        "نشانی پیوند باید HTTPS معتبر باشد.",
      );
    }
  }

  private media(dto: SaveSchoolAnnouncementDto) {
    const mediaUrl = this.optionalUrl(dto.mediaUrl);
    if (!mediaUrl) return { mediaUrl: null, mediaType: null };
    if (!dto.mediaType)
      throw new ApiException(
        400,
        "MEDIA_TYPE_REQUIRED",
        "نوع رسانه مشخص نیست.",
      );
    const host = new URL(mediaUrl).hostname.toLowerCase();
    if (
      dto.mediaType === "VIDEO" &&
      ![
        "youtube.com",
        "www.youtube.com",
        "youtu.be",
        "aparat.com",
        "www.aparat.com",
      ].includes(host)
    ) {
      throw new ApiException(
        400,
        "MEDIA_HOST_FORBIDDEN",
        "فقط ویدئوی YouTube یا Aparat پشتیبانی می‌شود.",
      );
    }
    return { mediaUrl, mediaType: dto.mediaType };
  }

  private async recipientIds(
    organizationId: string,
    dto: SaveSchoolAnnouncementDto,
  ) {
    if (dto.audience !== "USERS" && dto.audience !== "ALL") return [];
    const explicitIds = [...new Set(dto.recipientIds ?? [])];
    const roleCodes = [...new Set(dto.recipientRoleCodes ?? [])];
    if (dto.audience === "ALL")
      return this.activeOrganizationUserIds(organizationId);
    if ((!explicitIds.length && !roleCodes.length) || explicitIds.length > 100)
      throw new ApiException(
        400,
        "INVALID_RECIPIENTS",
        "حداقل یک دریافت‌کننده یا نقش دریافت‌کننده انتخاب کنید.",
      );
    const rows = await this.memberships
      .createQueryBuilder("membership")
      .innerJoin("membership.user", "user")
      .leftJoin("membership.roleAssignments", "assignment")
      .leftJoin("assignment.role", "role")
      .select("user.id", "id")
      .where("membership.organizationId = :organizationId", { organizationId })
      .andWhere("membership.status = :status", {
        status: MembershipStatus.ACTIVE,
      })
      .andWhere(
        new Brackets((qb) => {
          if (explicitIds.length)
            qb.where("user.id IN (:...explicitIds)", { explicitIds });
          if (roleCodes.length) {
            if (explicitIds.length)
              qb.orWhere("role.code IN (:...roleCodes)", { roleCodes });
            else qb.where("role.code IN (:...roleCodes)", { roleCodes });
          }
        }),
      )
      .distinct(true)
      .getRawMany<{ id: string }>();
    const ids = rows.map((row) => row.id);
    if (explicitIds.some((id) => !ids.includes(id)))
      throw new ApiException(
        403,
        "RECIPIENT_OUT_OF_SCOPE",
        "دریافت‌کننده خارج از مدرسه فعال است.",
      );
    if (!ids.length)
      throw new ApiException(
        422,
        "RECIPIENT_ROLE_EMPTY",
        "برای نقش‌های انتخاب‌شده عضو فعالی پیدا نشد.",
      );
    return ids;
  }

  private async activeOrganizationUserIds(organizationId: string) {
    const rows = await this.memberships.find({
      where: {
        organization: { id: organizationId },
        status: MembershipStatus.ACTIVE,
      },
      relations: { user: true },
    });
    const ids = [...new Set(rows.map((membership) => membership.user.id))];
    if (!ids.length)
      throw new ApiException(
        422,
        "RECIPIENTS_EMPTY",
        "عضو فعالی در مدرسه وجود ندارد.",
      );
    return ids;
  }

  private async setRecipients(
    announcement: SchoolAnnouncement,
    userIds: string[],
  ) {
    await this.recipients.delete({ announcement: { id: announcement.id } });
    if (userIds.length)
      await this.recipients.save(
        userIds.map((id) =>
          this.recipients.create({ announcement, user: { id } as User }),
        ),
      );
  }
}
