import { type EntityManager } from "typeorm";
import { Conversation } from "../../database/entities/conversation.entity";
import { Organization } from "../../database/entities/organization.entity";
import { User } from "../../database/entities/user.entity";
export declare function ensureOrganizationChat(manager: EntityManager, organization: Organization, member?: User): Promise<Conversation>;
export declare function leaveOrganizationChat(manager: EntityManager, organizationId: string, userId: string): Promise<void>;
