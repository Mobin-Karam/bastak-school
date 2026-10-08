import { Student } from "./student.entity";
import { User } from "./user.entity";
export type StudentContactType = "FATHER" | "MOTHER" | "LEGAL_GUARDIAN" | "EMERGENCY";
export declare class StudentContact {
    id: string;
    student: Student;
    type: StudentContactType;
    fullName: string;
    nationalCode?: string | null;
    phoneNumber?: string | null;
    occupation?: string | null;
    linkedUser?: User | null;
    createdAt: Date;
    updatedAt: Date;
}
