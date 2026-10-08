import { Organization } from "./organization.entity";
import { User } from "./user.entity";
export declare class UserCapabilityGrant {
    id: string;
    user: User;
    organization: Organization;
    capability: string;
    createdAt: Date;
}
