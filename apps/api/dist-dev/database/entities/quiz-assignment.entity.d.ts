import { Quiz } from "./quiz.entity";
import { Student } from "./student.entity";
export declare class QuizAssignment {
    id: string;
    quiz: Quiz;
    student: Student;
    createdAt: Date;
}
