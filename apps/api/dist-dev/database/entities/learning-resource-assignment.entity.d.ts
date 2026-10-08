import { LearningResource } from "./learning-resource.entity";
import { Student } from "./student.entity";
export declare class LearningResourceAssignment {
    id: string;
    resource: LearningResource;
    student: Student;
    assignedAt: Date;
}
