import { EducationClass } from "./education-class.entity";
import { Quiz } from "./quiz.entity";
export declare class QuizClassAssignment {
    id: string;
    quiz: Quiz;
    classroom: EducationClass;
    createdAt: Date;
}
