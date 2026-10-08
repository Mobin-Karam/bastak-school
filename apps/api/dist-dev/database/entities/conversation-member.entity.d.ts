import { Conversation } from "./conversation.entity";
import { User } from "./user.entity";
export declare enum ConversationMemberRole {
    OWNER = "OWNER",
    ADMIN = "ADMIN",
    MEMBER = "MEMBER"
}
export declare class ConversationMember {
    id: string;
    conversation: Conversation;
    user: User;
    role: ConversationMemberRole;
    muted: boolean;
    leftAt?: Date | null;
    lastReadAt?: Date | null;
    joinedAt: Date;
}
