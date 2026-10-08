import { Student } from "./student.entity";
import { ExamSyllabus } from "./exam-syllabus.entity";
export declare enum SyllabusProgressStatus {
    UNREAD = "unread",
    READ = "read",
    TESTED = "tested",
    REVIEW = "review",
    MASTERED = "mastered"
}
export declare class SyllabusProgress {
    id: string;
    student: Student;
    syllabus: ExamSyllabus;
    status: SyllabusProgressStatus;
    accuracy: number;
    note: string;
    updatedAt: Date;
}
