import { Organization } from "./organization.entity";
import { Subject } from "./subject.entity";
import { User } from "./user.entity";
export declare class TeacherSubjectAssignment {
    id: string;
    teacher: User;
    subject: Subject;
    organization: Organization;
    createdAt: Date;
}
