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
exports.SchoolHomeService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const api_exception_1 = require("../../common/exceptions/api.exception");
const education_class_entity_1 = require("../../database/entities/education-class.entity");
const education_class_enrollment_entity_1 = require("../../database/entities/education-class-enrollment.entity");
const organization_entity_1 = require("../../database/entities/organization.entity");
const school_announcement_entity_1 = require("../../database/entities/school-announcement.entity");
const school_prayer_time_entity_1 = require("../../database/entities/school-prayer-time.entity");
const user_relationship_entity_1 = require("../../database/entities/user-relationship.entity");
const authorization_1 = require("../authorization");
let SchoolHomeService = class SchoolHomeService {
    organizations;
    prayers;
    announcementsRepo;
    classes;
    enrollments;
    relationships;
    authorization;
    constructor(organizations, prayers, announcementsRepo, classes, enrollments, relationships, authorization) {
        this.organizations = organizations;
        this.prayers = prayers;
        this.announcementsRepo = announcementsRepo;
        this.classes = classes;
        this.enrollments = enrollments;
        this.relationships = relationships;
        this.authorization = authorization;
    }
    async prayerTimes(user, organizationId, date) {
        const organization = await this.scopedOrganization(user, organizationId, "prayer_times.read");
        const isDefault = date === "";
        const day = isDefault
            ? ""
            : (date ?? new Date().toISOString().slice(0, 10));
        const row = await this.prayers.findOne({
            where: { organization: { id: organization.id }, date: day },
        });
        const fallback = !row && !isDefault
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
    async savePrayerTimes(user, organizationId, dto) {
        const organization = await this.scopedOrganization(user, organizationId, "prayer_times.manage");
        const date = dto.date ?? "";
        let row = await this.prayers.findOne({
            where: { organization: { id: organization.id }, date },
        });
        if (!row)
            row = this.prayers.create({ organization, date });
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
    async deletePrayerTimes(user, organizationId, date) {
        const organization = await this.scopedOrganization(user, organizationId, "prayer_times.manage");
        const row = await this.prayers.findOne({
            where: { organization: { id: organization.id }, date: date ?? "" },
        });
        if (!row)
            return { deleted: false };
        await this.prayers.remove(row);
        return { deleted: true };
    }
    async announcements(user, organizationId) {
        const organization = await this.scopedOrganization(user, organizationId, "announcements.read");
        const context = this.context(user);
        const now = new Date();
        const query = this.announcementsRepo
            .createQueryBuilder("announcement")
            .leftJoinAndSelect("announcement.classroom", "classroom")
            .where("announcement.organizationId = :organizationId", {
            organizationId: organization.id,
        })
            .andWhere("announcement.status = 'ACTIVE'")
            .andWhere(new typeorm_2.Brackets((qb) => qb
            .where("announcement.expiresAt IS NULL")
            .orWhere("announcement.expiresAt > :now", { now })));
        if (!this.isManager(context)) {
            const classIds = await this.audienceClassIds(user, organization.id);
            query.andWhere(new typeorm_2.Brackets((qb) => {
                if (this.isStudentAudience(context)) {
                    qb.where("announcement.audience = 'STUDENTS'");
                    if (classIds.length)
                        qb.orWhere("announcement.audience = 'CLASS' AND announcement.classroomId IN (:...classIds)", { classIds });
                    return;
                }
                qb.where("announcement.audience = 'STAFF'");
            }));
        }
        const rows = await query
            .orderBy("announcement.publishedAt", "DESC")
            .addOrderBy("announcement.createdAt", "DESC")
            .getMany();
        return rows.map((row) => this.announcementView(row));
    }
    async saveAnnouncement(user, organizationId, dto) {
        const organization = await this.scopedOrganization(user, organizationId, "announcements.manage");
        const classroom = await this.classroomForAnnouncement(organization.id, dto.audience, dto.classroomId);
        const status = dto.status ?? "ACTIVE";
        const publishedAt = status === "ACTIVE" ? new Date() : null;
        const row = this.announcementsRepo.create({
            organization,
            classroom,
            audience: dto.audience,
            title: dto.title.trim(),
            body: dto.body.trim(),
            status,
            publishedAt,
            expiresAt: publishedAt
                ? new Date(publishedAt.getTime() + 24 * 60 * 60 * 1000)
                : null,
            createdBy: { id: user.id },
        });
        return this.announcementView(await this.announcementsRepo.save(row));
    }
    async updateAnnouncement(user, id, dto) {
        const row = await this.announcementsRepo.findOne({
            where: { id },
            relations: { organization: true },
        });
        if (!row)
            throw new api_exception_1.ApiException(404, "ANNOUNCEMENT_NOT_FOUND", "پیام پیدا نشد.");
        await this.scopedOrganization(user, row.organization.id, "announcements.manage");
        const classroom = await this.classroomForAnnouncement(row.organization.id, dto.audience, dto.classroomId);
        const status = dto.status ?? row.status;
        const publishedAt = status === "ACTIVE" ? (row.publishedAt ?? new Date()) : null;
        Object.assign(row, {
            classroom,
            audience: dto.audience,
            title: dto.title.trim(),
            body: dto.body.trim(),
            status,
            publishedAt,
            expiresAt: publishedAt
                ? (row.expiresAt ??
                    new Date(publishedAt.getTime() + 24 * 60 * 60 * 1000))
                : null,
        });
        return this.announcementView(await this.announcementsRepo.save(row));
    }
    async scopedOrganization(user, requestedId, capability) {
        const context = this.context(user);
        this.authorization.requireCapability(context, capability);
        const organizationId = requestedId ?? context.organizationIds[0];
        if (!organizationId)
            throw new api_exception_1.ApiException(422, "ORGANIZATION_REQUIRED", "مدرسه فعال را انتخاب کنید.");
        if (!this.authorization.canAccessOrganization(context, organizationId, capability))
            throw new api_exception_1.ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
        const organization = await this.organizations.findOneBy({
            id: organizationId,
        });
        if (!organization)
            throw new api_exception_1.ApiException(404, "ORGANIZATION_NOT_FOUND", "مدرسه پیدا نشد.");
        return organization;
    }
    async classroomForAnnouncement(organizationId, audience, classroomId) {
        if (audience !== "CLASS")
            return null;
        if (!classroomId)
            throw new api_exception_1.ApiException(422, "ANNOUNCEMENT_CLASS_REQUIRED", "برای پیام کلاسی، کلاس لازم است.");
        const classroom = await this.classes.findOne({
            where: { id: classroomId, organization: { id: organizationId } },
        });
        if (!classroom)
            throw new api_exception_1.ApiException(404, "CLASS_NOT_FOUND", "کلاس پیدا نشد.");
        return classroom;
    }
    async audienceClassIds(user, organizationId) {
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
                .innerJoin(user_relationship_entity_1.UserRelationship, "relationship", "relationship.toStudentId = enrollment.studentId AND relationship.fromUserId = :userId AND relationship.status = 'ACTIVE' AND relationship.type = 'GUARDIAN_OF'", { userId: user.id })
                .where("enrollment.classroomId IS NOT NULL")
                .getMany();
            return [
                ...new Set(rows.map((row) => row.classroomId).filter(Boolean)),
            ];
        }
        return [];
    }
    isManager(context) {
        return context.roles.some((role) => [
            "PLATFORM_ADMIN",
            "ORGANIZATION_ADMIN",
            "PRINCIPAL",
            "SCHOOL_SUPERVISOR",
        ].includes(role));
    }
    isStudentAudience(context) {
        return context.roles.some((role) => ["STUDENT", "GUARDIAN"].includes(role));
    }
    context(user) {
        return {
            ...user,
            roles: user.roles ?? [user.role],
            capabilities: user.capabilities ?? [],
            membershipIds: user.membershipIds ?? [],
            organizationIds: user.organizationIds ?? [],
        };
    }
    prayerView(row) {
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
    announcementView(row) {
        return {
            id: row.id,
            organizationId: row.organization?.id,
            audience: row.audience,
            classroomId: row.classroom?.id ?? null,
            title: row.title,
            body: row.body,
            status: row.status,
            publishedAt: row.publishedAt,
            expiresAt: row.expiresAt,
            createdAt: row.createdAt,
        };
    }
};
exports.SchoolHomeService = SchoolHomeService;
exports.SchoolHomeService = SchoolHomeService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(organization_entity_1.Organization)),
    __param(1, (0, typeorm_1.InjectRepository)(school_prayer_time_entity_1.SchoolPrayerTime)),
    __param(2, (0, typeorm_1.InjectRepository)(school_announcement_entity_1.SchoolAnnouncement)),
    __param(3, (0, typeorm_1.InjectRepository)(education_class_entity_1.EducationClass)),
    __param(4, (0, typeorm_1.InjectRepository)(education_class_enrollment_entity_1.EducationClassEnrollment)),
    __param(5, (0, typeorm_1.InjectRepository)(user_relationship_entity_1.UserRelationship)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        authorization_1.AuthorizationService])
], SchoolHomeService);
//# sourceMappingURL=school-home.service.js.map