import { EducationClass } from "./education-class.entity";
import { Exam } from "./exam.entity";
export declare class ExamClassAssignment {
    id: string;
    exam: Exam;
    classroom: EducationClass;
    createdAt: Date;
}
