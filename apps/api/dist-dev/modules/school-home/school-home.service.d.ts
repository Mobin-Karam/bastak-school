import { Repository } from "typeorm";
import { EducationClass } from "../../database/entities/education-class.entity";
import { EducationClassEnrollment } from "../../database/entities/education-class-enrollment.entity";
import { Organization } from "../../database/entities/organization.entity";
import { SchoolAnnouncement } from "../../database/entities/school-announcement.entity";
import { SchoolPrayerTime } from "../../database/entities/school-prayer-time.entity";
import { UserRelationship } from "../../database/entities/user-relationship.entity";
import { AuthenticatedUser } from "../auth";
import { AuthorizationService } from "../authorization";
import { SavePrayerTimeDto, SaveSchoolAnnouncementDto } from "./school-home.dto";
export declare class SchoolHomeService {
    private readonly organizations;
    private readonly prayers;
    private readonly announcementsRepo;
    private readonly classes;
    private readonly enrollments;
    private readonly relationships;
    private readonly authorization;
    constructor(organizations: Repository<Organization>, prayers: Repository<SchoolPrayerTime>, announcementsRepo: Repository<SchoolAnnouncement>, classes: Repository<EducationClass>, enrollments: Repository<EducationClassEnrollment>, relationships: Repository<UserRelationship>, authorization: AuthorizationService);
    prayerTimes(user: AuthenticatedUser, organizationId?: string, date?: string): Promise<{
        organizationId: string;
        date: string;
        times: {
            id: string;
            date: string;
            fajr: string;
            sunrise: string;
            dhuhr: string;
            asr: string;
            maghrib: string;
            isha: string;
            source: string;
            updatedAt: Date;
        } | null;
    }>;
    savePrayerTimes(user: AuthenticatedUser, organizationId: string, dto: SavePrayerTimeDto): Promise<{
        id: string;
        date: string;
        fajr: string;
        sunrise: string;
        dhuhr: string;
        asr: string;
        maghrib: string;
        isha: string;
        source: string;
        updatedAt: Date;
    }>;
    deletePrayerTimes(user: AuthenticatedUser, organizationId: string, date?: string): Promise<{
        deleted: boolean;
    }>;
    announcements(user: AuthenticatedUser, organizationId?: string): Promise<{
        id: string;
        organizationId: string;
        audience: import("../../database/entities/school-announcement.entity").SchoolAnnouncementAudience;
        classroomId: string | null;
        title: string;
        body: string;
        status: "DRAFT" | "ACTIVE" | "ARCHIVED";
        publishedAt: Date | null | undefined;
        expiresAt: Date | null | undefined;
        createdAt: Date;
    }[]>;
    saveAnnouncement(user: AuthenticatedUser, organizationId: string, dto: SaveSchoolAnnouncementDto): Promise<{
        id: string;
        organizationId: string;
        audience: import("../../database/entities/school-announcement.entity").SchoolAnnouncementAudience;
        classroomId: string | null;
        title: string;
        body: string;
        status: "DRAFT" | "ACTIVE" | "ARCHIVED";
        publishedAt: Date | null | undefined;
        expiresAt: Date | null | undefined;
        createdAt: Date;
    }>;
    updateAnnouncement(user: AuthenticatedUser, id: string, dto: SaveSchoolAnnouncementDto): Promise<{
        id: string;
        organizationId: string;
        audience: import("../../database/entities/school-announcement.entity").SchoolAnnouncementAudience;
        classroomId: string | null;
        title: string;
        body: string;
        status: "DRAFT" | "ACTIVE" | "ARCHIVED";
        publishedAt: Date | null | undefined;
        expiresAt: Date | null | undefined;
        createdAt: Date;
    }>;
    private scopedOrganization;
    private classroomForAnnouncement;
    private audienceClassIds;
    private isManager;
    private isStudentAudience;
    private context;
    private prayerView;
    private announcementView;
}
