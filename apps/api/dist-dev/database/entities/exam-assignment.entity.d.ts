import { Exam } from "./exam.entity";
import { Student } from "./student.entity";
import { User } from "./user.entity";
export declare class ExamAssignment {
    id: string;
    exam: Exam;
    student: Student;
    assignedBy: User;
    assignedAt: Date;
    createdAt: Date;
}
