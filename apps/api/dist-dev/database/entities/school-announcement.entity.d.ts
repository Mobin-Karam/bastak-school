import { EducationClass } from "./education-class.entity";
import { Organization } from "./organization.entity";
import { User } from "./user.entity";
export type SchoolAnnouncementAudience = "STAFF" | "STUDENTS" | "CLASS";
export declare class SchoolAnnouncement {
    id: string;
    organization: Organization;
    audience: SchoolAnnouncementAudience;
    classroom?: EducationClass | null;
    title: string;
    body: string;
    status: "DRAFT" | "ACTIVE" | "ARCHIVED";
    publishedAt?: Date | null;
    expiresAt?: Date | null;
    createdBy?: User | null;
    createdAt: Date;
    updatedAt: Date;
}
