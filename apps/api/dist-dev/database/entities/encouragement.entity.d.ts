import { Student } from "./student.entity";
import { User } from "./user.entity";
export declare class Encouragement {
    id: string;
    student: Student;
    guardian: User;
    message: string;
    kind: string;
    createdAt: Date;
}
