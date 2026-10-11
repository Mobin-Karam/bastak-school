import { Organization } from "./organization.entity";
import { User } from "./user.entity";
import { EducationClassBook } from "./education-class-book.entity";
import { EducationClassEnrollment } from "./education-class-enrollment.entity";
export declare class EducationClass {
    id: string;
    organization: Organization;
    code: string;
    name: string;
    schoolYear: string;
    gradeId: number;
    educationTypeId: string;
    trackId: string;
    capacity: number;
    status: "ACTIVE" | "ARCHIVED";
    description: string;
    advisor?: User | null;
    books: EducationClassBook[];
    enrollments: EducationClassEnrollment[];
    timetableSectionId: string | null;
    timetableSection?: object;
    createdAt: Date;
    updatedAt: Date;
}
