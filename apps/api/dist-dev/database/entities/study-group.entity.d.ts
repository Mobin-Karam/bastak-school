import { Organization } from "./organization.entity";
import { EducationClass } from "./education-class.entity";
import { StudyGroupMembership } from "./study-group-membership.entity";
export declare class StudyGroup {
    id: string;
    organization: Organization;
    classroom?: EducationClass | null;
    code: string;
    name: string;
    description: string;
    status: "ACTIVE" | "ARCHIVED";
    memberships: StudyGroupMembership[];
    createdAt: Date;
    updatedAt: Date;
}
