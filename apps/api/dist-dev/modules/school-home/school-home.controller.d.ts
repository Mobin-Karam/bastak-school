import { AuthenticatedUser } from "../auth";
import { SavePrayerTimeDto, SaveSchoolAnnouncementDto } from "./school-home.dto";
import { SchoolHomeService } from "./school-home.service";
export declare class SchoolHomeController {
    private readonly schoolHome;
    constructor(schoolHome: SchoolHomeService);
    prayerTimes(user: AuthenticatedUser, organizationId?: string, date?: string): Promise<{
        ok: boolean;
        data: {
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
        };
    }>;
    savePrayerTimes(user: AuthenticatedUser, organizationId: string, dto: SavePrayerTimeDto): Promise<{
        ok: boolean;
        data: {
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
        };
    }>;
    deletePrayerTimes(user: AuthenticatedUser, organizationId: string, date?: string): Promise<{
        ok: boolean;
        data: {
            deleted: boolean;
        };
    }>;
    announcements(user: AuthenticatedUser, organizationId?: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            organizationId: string;
            audience: import("../../database/entities/school-announcement.entity").SchoolAnnouncementAudience;
            classroomId: string | null;
            title: string;
            body: string;
            status: "DRAFT" | "ARCHIVED" | "ACTIVE";
            publishedAt: Date | null | undefined;
            expiresAt: Date | null | undefined;
            createdAt: Date;
        }[];
    }>;
    createAnnouncement(user: AuthenticatedUser, organizationId: string, dto: SaveSchoolAnnouncementDto): Promise<{
        ok: boolean;
        data: {
            id: string;
            organizationId: string;
            audience: import("../../database/entities/school-announcement.entity").SchoolAnnouncementAudience;
            classroomId: string | null;
            title: string;
            body: string;
            status: "DRAFT" | "ARCHIVED" | "ACTIVE";
            publishedAt: Date | null | undefined;
            expiresAt: Date | null | undefined;
            createdAt: Date;
        };
    }>;
    updateAnnouncement(user: AuthenticatedUser, id: string, dto: SaveSchoolAnnouncementDto): Promise<{
        ok: boolean;
        data: {
            id: string;
            organizationId: string;
            audience: import("../../database/entities/school-announcement.entity").SchoolAnnouncementAudience;
            classroomId: string | null;
            title: string;
            body: string;
            status: "DRAFT" | "ARCHIVED" | "ACTIVE";
            publishedAt: Date | null | undefined;
            expiresAt: Date | null | undefined;
            createdAt: Date;
        };
    }>;
}
