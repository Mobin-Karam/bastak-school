import { Student } from "./student.entity";
import { Subject } from "./subject.entity";
export declare class StudentSubject {
    id: string;
    student: Student;
    subject: Subject;
    enabled: boolean;
    displayName: string;
    weeklyTargetMinutes: number;
    createdAt: Date;
    updatedAt: Date;
}
