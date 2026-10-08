import { Organization } from "./organization.entity";
import { User } from "./user.entity";
export type AccountChangeRequestStatus = "PENDING" | "APPROVED" | "REJECTED";
export declare class AccountChangeRequest {
    id: string;
    organization: Organization;
    user: User;
    kind: "PHONE_NUMBER";
    requestedValue: string;
    status: AccountChangeRequestStatus;
    reason: string;
    reviewNote: string;
    reviewedBy?: User | null;
    reviewedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
