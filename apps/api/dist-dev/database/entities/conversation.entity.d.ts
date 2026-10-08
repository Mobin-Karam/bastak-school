import { User } from "./user.entity";
import { ConversationMember } from "./conversation-member.entity";
import { Organization } from "./organization.entity";
export declare enum ConversationType {
    DIRECT = "DIRECT",
    GROUP = "GROUP"
}
export declare class Conversation {
    id: string;
    type: ConversationType;
    title: string;
    description: string;
    permissions: Record<string, boolean>;
    archivedAt?: Date | null;
    owner?: User | null;
    organization?: Organization | null;
    autoManaged: boolean;
    members: ConversationMember[];
    createdAt: Date;
    updatedAt: Date;
}
