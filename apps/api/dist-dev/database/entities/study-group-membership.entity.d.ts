import { Student } from "./student.entity";
import { StudyGroup } from "./study-group.entity";
export declare class StudyGroupMembership {
    id: string;
    group: StudyGroup;
    student: Student;
    createdAt: Date;
}
