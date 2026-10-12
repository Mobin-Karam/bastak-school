import { EducationClass } from "./education-class.entity";
import { EducationClassBook } from "./education-class-book.entity";
import { Organization } from "./organization.entity";
import { User } from "./user.entity";
export declare class SchoolScheduleEntry {
    id: string;
    organization: Organization;
    classroom?: EducationClass | null;
    classBook?: EducationClassBook | null;
    teacher?: User | null;
    title: string;
    weekday: number;
    startTime: string;
    endTime: string;
    room: string;
    status: "ACTIVE" | "ARCHIVED";
    createdAt: Date;
    updatedAt: Date;
}
