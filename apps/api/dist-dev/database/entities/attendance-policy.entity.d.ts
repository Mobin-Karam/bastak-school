import { Organization } from "./organization.entity";
export declare class AttendancePolicy {
    id: string;
    organization: Organization;
    timeZone: string;
    dayStartsAt: string;
    allowPartialSubmission: boolean;
    lateCountsAsPresent: boolean;
    updatedAt: Date;
}
