import type { EducationClass } from "./education-class.entity";
import type { Student } from "./student.entity";
export declare class EducationClassEnrollment {
    id: string;
    classroom: EducationClass;
    student: Student;
    createdAt: Date;
}
