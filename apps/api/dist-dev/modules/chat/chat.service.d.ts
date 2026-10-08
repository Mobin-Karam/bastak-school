import { DataSource, Repository } from "typeorm";
import { ChatMessage, ChatMessageType } from "../../database/entities/chat-message.entity";
import { ChatConfiguration } from "../../database/entities/chat-configuration.entity";
import { Conversation } from "../../database/entities/conversation.entity";
import { ConversationMember } from "../../database/entities/conversation-member.entity";
import { MessageReaction } from "../../database/entities/message-reaction.entity";
import { OrganizationMembership } from "../../database/entities/organization-membership.entity";
import { Student } from "../../database/entities/student.entity";
import { User } from "../../database/entities/user.entity";
import { UserRelationship } from "../../database/entities/user-relationship.entity";
import { UserRoleAssignment } from "../../database/entities/user-role-assignment.entity";
import { ConversationMemberRole } from "../../database/entities/conversation-member.entity";
import { AuthenticatedUser } from "../auth";
import { RealtimeService } from "../realtime";
import { NotificationsService } from "../notifications";
export declare class ChatService {
    private messages;
    private students;
    private users;
    private realtime;
    private conversationsRepo;
    private members;
    private reactions;
    private configurationRepo;
    private relationships;
    private orgMembers;
    private roleAssignments;
    private db;
    private notifications?;
    constructor(messages: Repository<ChatMessage>, students: Repository<Student>, users: Repository<User>, realtime: RealtimeService, conversationsRepo: Repository<Conversation>, members: Repository<ConversationMember>, reactions: Repository<MessageReaction>, configurationRepo: Repository<ChatConfiguration>, relationships: Repository<UserRelationship>, orgMembers: Repository<OrganizationMembership>, roleAssignments: Repository<UserRoleAssignment>, db: DataSource, notifications?: NotificationsService | undefined);
    private readonly defaultEmojis;
    configuration(): Promise<{
        allowedEmojis: string[];
    }>;
    updateConfiguration(user: AuthenticatedUser, emojis: unknown): Promise<{
        allowedEmojis: string[];
    }>;
    profile(actor: AuthenticatedUser, userId: string): Promise<{
        usernameChange?: {
            count: number;
            nextAllowedAt: Date | null;
            allowed: boolean;
        } | undefined;
        displayName: string;
        bio: string;
        avatarUrl: string;
        id: string;
        username: string;
        name: string;
        accountRole: import("../../database/entities/user.entity").UserRole;
        studentId: string | undefined;
        studentName: string | undefined;
        studentGrade: string | undefined;
        studentMajor: string | undefined;
        studentAccountStatus: "active" | "archived" | "inactive" | undefined;
    }>;
    updateProfile(actor: AuthenticatedUser, input: {
        displayName?: unknown;
        bio?: unknown;
        avatarUrl?: unknown;
        username?: unknown;
    }): Promise<{
        usernameChange?: {
            count: number;
            nextAllowedAt: Date | null;
            allowed: boolean;
        } | undefined;
        displayName: string;
        bio: string;
        avatarUrl: string;
        id: string;
        username: string;
        name: string;
        accountRole: import("../../database/entities/user.entity").UserRole;
        studentId: string | undefined;
        studentName: string | undefined;
        studentGrade: string | undefined;
        studentMajor: string | undefined;
        studentAccountStatus: "active" | "archived" | "inactive" | undefined;
    }>;
    allowUsernameChange(actor: AuthenticatedUser, userId: string): Promise<{
        userId: string;
        usernameChangeAllowed: boolean;
    }>;
    conversations(user: AuthenticatedUser): Promise<{
        lastMessage: {
            id: string;
            text: string;
            type: string;
            senderRole: import("../../database/entities/user.entity").UserRole;
            senderId: string;
            senderUserId: string;
            senderName: string;
            createdAt: Date;
            isRead: boolean;
            seen: boolean;
            readAt: Date | null;
            editedAt: Date | null;
            deletedAt: Date | null;
            mentions: string[];
            mentionUserIds: string[];
            replyToId: string | null;
            linkedTask: {
                id: string;
                title: string;
                subject: string;
                startTime: string;
                endTime: string;
            } | null;
        } | null;
        unread: number;
        muted: boolean;
        role: string;
        readOnly: boolean;
        observedStudent: {
            id: string;
            name: string;
        } | null;
        id: string;
        type: string;
        title: string;
        description: string;
        memberCount: number;
        participants: {
            role: string;
            isSelf: boolean;
            id: string;
            username: string;
            name: string;
            accountRole: import("../../database/entities/user.entity").UserRole;
            studentId: string | undefined;
            studentName: string | undefined;
            studentGrade: string | undefined;
            studentMajor: string | undefined;
            studentAccountStatus: "active" | "archived" | "inactive" | undefined;
            displayName: string | undefined;
            bio: string | undefined;
            avatarUrl: string | undefined;
        }[];
        peer: {
            role: string;
            isSelf: boolean;
            id: string;
            username: string;
            name: string;
            accountRole: import("../../database/entities/user.entity").UserRole;
            studentId: string | undefined;
            studentName: string | undefined;
            studentGrade: string | undefined;
            studentMajor: string | undefined;
            studentAccountStatus: "active" | "archived" | "inactive" | undefined;
            displayName: string | undefined;
            bio: string | undefined;
            avatarUrl: string | undefined;
        } | undefined;
        student: {
            id: string;
            name: string;
            username: string;
            grade: string | undefined;
            major: string | undefined;
            accountStatus: "active" | "archived" | "inactive" | undefined;
            organizations: {
                id: string;
                name: string;
            }[];
            advisors: {
                id: string;
                name: string;
                organizationId: string | null;
            }[];
            organization: {
                id: string;
                name: string;
            } | null;
            advisor: {
                id: string;
                name: string;
                organizationId: string | null;
            } | null;
        } | undefined;
        ownerId: string | null;
        autoManaged: boolean;
        organization: {
            id: string;
            name: string;
        } | null;
    }[]>;
    conversationsForStudent(user: AuthenticatedUser): Promise<{
        lastMessage: {
            id: string;
            text: string;
            type: string;
            senderRole: import("../../database/entities/user.entity").UserRole;
            senderId: string;
            senderUserId: string;
            senderName: string;
            createdAt: Date;
            isRead: boolean;
            seen: boolean;
            readAt: Date | null;
            editedAt: Date | null;
            deletedAt: Date | null;
            mentions: string[];
            mentionUserIds: string[];
            replyToId: string | null;
            linkedTask: {
                id: string;
                title: string;
                subject: string;
                startTime: string;
                endTime: string;
            } | null;
        } | null;
        unread: number;
        muted: boolean;
        role: string;
        readOnly: boolean;
        observedStudent: {
            id: string;
            name: string;
        } | null;
        id: string;
        type: string;
        title: string;
        description: string;
        memberCount: number;
        participants: {
            role: string;
            isSelf: boolean;
            id: string;
            username: string;
            name: string;
            accountRole: import("../../database/entities/user.entity").UserRole;
            studentId: string | undefined;
            studentName: string | undefined;
            studentGrade: string | undefined;
            studentMajor: string | undefined;
            studentAccountStatus: "active" | "archived" | "inactive" | undefined;
            displayName: string | undefined;
            bio: string | undefined;
            avatarUrl: string | undefined;
        }[];
        peer: {
            role: string;
            isSelf: boolean;
            id: string;
            username: string;
            name: string;
            accountRole: import("../../database/entities/user.entity").UserRole;
            studentId: string | undefined;
            studentName: string | undefined;
            studentGrade: string | undefined;
            studentMajor: string | undefined;
            studentAccountStatus: "active" | "archived" | "inactive" | undefined;
            displayName: string | undefined;
            bio: string | undefined;
            avatarUrl: string | undefined;
        } | undefined;
        student: {
            id: string;
            name: string;
            username: string;
            grade: string | undefined;
            major: string | undefined;
            accountStatus: "active" | "archived" | "inactive" | undefined;
            organizations: {
                id: string;
                name: string;
            }[];
            advisors: {
                id: string;
                name: string;
                organizationId: string | null;
            }[];
            organization: {
                id: string;
                name: string;
            } | null;
            advisor: {
                id: string;
                name: string;
                organizationId: string | null;
            } | null;
        } | undefined;
        ownerId: string | null;
        autoManaged: boolean;
        organization: {
            id: string;
            name: string;
        } | null;
    }[]>;
    createDirect(user: AuthenticatedUser, peerUserId: string, scopeVerified?: boolean): Promise<{
        id: string;
        type: string;
        title: string;
        description: string;
        memberCount: number;
        participants: {
            role: string;
            isSelf: boolean;
            id: string;
            username: string;
            name: string;
            accountRole: import("../../database/entities/user.entity").UserRole;
            studentId: string | undefined;
            studentName: string | undefined;
            studentGrade: string | undefined;
            studentMajor: string | undefined;
            studentAccountStatus: "active" | "archived" | "inactive" | undefined;
            displayName: string | undefined;
            bio: string | undefined;
            avatarUrl: string | undefined;
        }[];
        peer: {
            role: string;
            isSelf: boolean;
            id: string;
            username: string;
            name: string;
            accountRole: import("../../database/entities/user.entity").UserRole;
            studentId: string | undefined;
            studentName: string | undefined;
            studentGrade: string | undefined;
            studentMajor: string | undefined;
            studentAccountStatus: "active" | "archived" | "inactive" | undefined;
            displayName: string | undefined;
            bio: string | undefined;
            avatarUrl: string | undefined;
        } | undefined;
        student: {
            id: string;
            name: string;
            username: string;
            grade: string | undefined;
            major: string | undefined;
            accountStatus: "active" | "archived" | "inactive" | undefined;
            organizations: {
                id: string;
                name: string;
            }[];
            advisors: {
                id: string;
                name: string;
                organizationId: string | null;
            }[];
            organization: {
                id: string;
                name: string;
            } | null;
            advisor: {
                id: string;
                name: string;
                organizationId: string | null;
            } | null;
        } | undefined;
        ownerId: string | null;
        autoManaged: boolean;
        organization: {
            id: string;
            name: string;
        } | null;
    }>;
    createGroup(user: AuthenticatedUser, title: string, userIds: string[], description?: string): Promise<{
        id: string;
        type: string;
        title: string;
    }>;
    messagesForConversation(user: AuthenticatedUser, id: string, options?: {
        limit?: number;
        before?: string;
    }): Promise<{
        id: string;
        text: string;
        type: string;
        senderRole: import("../../database/entities/user.entity").UserRole;
        senderId: string;
        senderUserId: string;
        senderName: string;
        createdAt: Date;
        isRead: boolean;
        seen: boolean;
        readAt: Date | null;
        editedAt: Date | null;
        deletedAt: Date | null;
        mentions: string[];
        mentionUserIds: string[];
        replyToId: string | null;
        linkedTask: {
            id: string;
            title: string;
            subject: string;
            startTime: string;
            endTime: string;
        } | null;
    }[]>;
    detail(user: AuthenticatedUser, id: string): Promise<{
        description: string;
        memberCount: number;
        myRole: string;
        muted: boolean;
        readOnly: boolean;
        observedStudent: {
            id: string;
            name: string;
        } | null;
        permissions: {
            members_can_send_messages: boolean;
            members_can_add_members: boolean;
            members_can_invite: boolean;
            members_can_react: boolean;
            members_can_use_mentions: boolean;
            members_can_share_study_state: boolean;
            members_can_share_exam_results: boolean;
            members_can_share_learning_progress: boolean;
            members_can_edit_own_messages: boolean;
            members_can_delete_own_messages: boolean;
            admins_can_delete_messages: boolean;
        };
        owner: {
            id: string;
            username: string;
            name: string;
            accountRole: import("../../database/entities/user.entity").UserRole;
            studentId: string | undefined;
            studentName: string | undefined;
            studentGrade: string | undefined;
            studentMajor: string | undefined;
            studentAccountStatus: "active" | "archived" | "inactive" | undefined;
            displayName: string | undefined;
            bio: string | undefined;
            avatarUrl: string | undefined;
        } | undefined;
        id: string;
        type: string;
        title: string;
        participants: {
            role: string;
            isSelf: boolean;
            id: string;
            username: string;
            name: string;
            accountRole: import("../../database/entities/user.entity").UserRole;
            studentId: string | undefined;
            studentName: string | undefined;
            studentGrade: string | undefined;
            studentMajor: string | undefined;
            studentAccountStatus: "active" | "archived" | "inactive" | undefined;
            displayName: string | undefined;
            bio: string | undefined;
            avatarUrl: string | undefined;
        }[];
        peer: {
            role: string;
            isSelf: boolean;
            id: string;
            username: string;
            name: string;
            accountRole: import("../../database/entities/user.entity").UserRole;
            studentId: string | undefined;
            studentName: string | undefined;
            studentGrade: string | undefined;
            studentMajor: string | undefined;
            studentAccountStatus: "active" | "archived" | "inactive" | undefined;
            displayName: string | undefined;
            bio: string | undefined;
            avatarUrl: string | undefined;
        } | undefined;
        student: {
            id: string;
            name: string;
            username: string;
            grade: string | undefined;
            major: string | undefined;
            accountStatus: "active" | "archived" | "inactive" | undefined;
            organizations: {
                id: string;
                name: string;
            }[];
            advisors: {
                id: string;
                name: string;
                organizationId: string | null;
            }[];
            organization: {
                id: string;
                name: string;
            } | null;
            advisor: {
                id: string;
                name: string;
                organizationId: string | null;
            } | null;
        } | undefined;
        ownerId: string | null;
        autoManaged: boolean;
        organization: {
            id: string;
            name: string;
        } | null;
    }>;
    listMembers(user: AuthenticatedUser, id: string, search?: string): Promise<{
        role: string;
        joinedAt: Date;
        muted: boolean;
        id: string;
        username: string;
        name: string;
        accountRole: import("../../database/entities/user.entity").UserRole;
        studentId: string | undefined;
        studentName: string | undefined;
        studentGrade: string | undefined;
        studentMajor: string | undefined;
        studentAccountStatus: "active" | "archived" | "inactive" | undefined;
        displayName: string | undefined;
        bio: string | undefined;
        avatarUrl: string | undefined;
    }[]>;
    candidateUsers(user: AuthenticatedUser, id: string, search?: string): Promise<{
        id: string;
        username: string;
        name: string;
        accountRole: import("../../database/entities/user.entity").UserRole;
        studentId: string | undefined;
        studentName: string | undefined;
        studentGrade: string | undefined;
        studentMajor: string | undefined;
        studentAccountStatus: "active" | "archived" | "inactive" | undefined;
        displayName: string | undefined;
        bio: string | undefined;
        avatarUrl: string | undefined;
    }[]>;
    availableUsers(user: AuthenticatedUser, search?: string): Promise<{
        id: string;
        username: string;
        name: string;
        accountRole: import("../../database/entities/user.entity").UserRole;
        studentId: string | undefined;
        studentName: string | undefined;
        studentGrade: string | undefined;
        studentMajor: string | undefined;
        studentAccountStatus: "active" | "archived" | "inactive" | undefined;
        displayName: string | undefined;
        bio: string | undefined;
        avatarUrl: string | undefined;
    }[]>;
    addMember(user: AuthenticatedUser, id: string, targetUserId: string): Promise<{
        id: string;
        username: string;
        name: string;
        accountRole: import("../../database/entities/user.entity").UserRole;
        studentId: string | undefined;
        studentName: string | undefined;
        studentGrade: string | undefined;
        studentMajor: string | undefined;
        studentAccountStatus: "active" | "archived" | "inactive" | undefined;
        displayName: string | undefined;
        bio: string | undefined;
        avatarUrl: string | undefined;
    }>;
    updateGroup(user: AuthenticatedUser, id: string, body: {
        title?: string;
        description?: string;
        archived?: boolean;
    }): Promise<{
        description: string;
        memberCount: number;
        myRole: string;
        muted: boolean;
        readOnly: boolean;
        observedStudent: {
            id: string;
            name: string;
        } | null;
        permissions: {
            members_can_send_messages: boolean;
            members_can_add_members: boolean;
            members_can_invite: boolean;
            members_can_react: boolean;
            members_can_use_mentions: boolean;
            members_can_share_study_state: boolean;
            members_can_share_exam_results: boolean;
            members_can_share_learning_progress: boolean;
            members_can_edit_own_messages: boolean;
            members_can_delete_own_messages: boolean;
            admins_can_delete_messages: boolean;
        };
        owner: {
            id: string;
            username: string;
            name: string;
            accountRole: import("../../database/entities/user.entity").UserRole;
            studentId: string | undefined;
            studentName: string | undefined;
            studentGrade: string | undefined;
            studentMajor: string | undefined;
            studentAccountStatus: "active" | "archived" | "inactive" | undefined;
            displayName: string | undefined;
            bio: string | undefined;
            avatarUrl: string | undefined;
        } | undefined;
        id: string;
        type: string;
        title: string;
        participants: {
            role: string;
            isSelf: boolean;
            id: string;
            username: string;
            name: string;
            accountRole: import("../../database/entities/user.entity").UserRole;
            studentId: string | undefined;
            studentName: string | undefined;
            studentGrade: string | undefined;
            studentMajor: string | undefined;
            studentAccountStatus: "active" | "archived" | "inactive" | undefined;
            displayName: string | undefined;
            bio: string | undefined;
            avatarUrl: string | undefined;
        }[];
        peer: {
            role: string;
            isSelf: boolean;
            id: string;
            username: string;
            name: string;
            accountRole: import("../../database/entities/user.entity").UserRole;
            studentId: string | undefined;
            studentName: string | undefined;
            studentGrade: string | undefined;
            studentMajor: string | undefined;
            studentAccountStatus: "active" | "archived" | "inactive" | undefined;
            displayName: string | undefined;
            bio: string | undefined;
            avatarUrl: string | undefined;
        } | undefined;
        student: {
            id: string;
            name: string;
            username: string;
            grade: string | undefined;
            major: string | undefined;
            accountStatus: "active" | "archived" | "inactive" | undefined;
            organizations: {
                id: string;
                name: string;
            }[];
            advisors: {
                id: string;
                name: string;
                organizationId: string | null;
            }[];
            organization: {
                id: string;
                name: string;
            } | null;
            advisor: {
                id: string;
                name: string;
                organizationId: string | null;
            } | null;
        } | undefined;
        ownerId: string | null;
        autoManaged: boolean;
        organization: {
            id: string;
            name: string;
        } | null;
    }>;
    updatePermissions(user: AuthenticatedUser, id: string, permissions: Record<string, boolean>): Promise<Record<string, boolean>>;
    send(user: AuthenticatedUser, id: string, text: string, input?: {
        replyToId?: string;
        mentions?: string[];
        type?: ChatMessageType;
        taskId?: string;
    }): Promise<{
        id: string;
        text: string;
        type: string;
        senderRole: import("../../database/entities/user.entity").UserRole;
        senderId: string;
        senderUserId: string;
        senderName: string;
        createdAt: Date;
        isRead: boolean;
        seen: boolean;
        readAt: Date | null;
        editedAt: Date | null;
        deletedAt: Date | null;
        mentions: string[];
        mentionUserIds: string[];
        replyToId: string | null;
        linkedTask: {
            id: string;
            title: string;
            subject: string;
            startTime: string;
            endTime: string;
        } | null;
    }>;
    markRead(user: AuthenticatedUser, id: string): Promise<{
        conversationId: string;
        updated: number;
        unread: number;
        readOnly: boolean;
    } | {
        conversationId: string;
        updated: number;
        unread: number;
        readOnly?: undefined;
    }>;
    edit(user: AuthenticatedUser, id: string, messageId: string, text: string): Promise<{
        id: string;
        text: string;
        type: string;
        senderRole: import("../../database/entities/user.entity").UserRole;
        senderId: string;
        senderUserId: string;
        senderName: string;
        createdAt: Date;
        isRead: boolean;
        seen: boolean;
        readAt: Date | null;
        editedAt: Date | null;
        deletedAt: Date | null;
        mentions: string[];
        mentionUserIds: string[];
        replyToId: string | null;
        linkedTask: {
            id: string;
            title: string;
            subject: string;
            startTime: string;
            endTime: string;
        } | null;
    }>;
    removeMessage(user: AuthenticatedUser, id: string, messageId: string, moderate?: boolean): Promise<{
        id: string;
        deleted: boolean;
    }>;
    react(user: AuthenticatedUser, id: string, messageId: string, emoji: string): Promise<{
        active: boolean;
    }>;
    setMute(user: AuthenticatedUser, id: string, muted: boolean): Promise<{
        id: string;
        muted: boolean;
    }>;
    leave(user: AuthenticatedUser, id: string): Promise<{
        id: string;
        left: boolean;
    }>;
    transferOwner(user: AuthenticatedUser, id: string, targetUserId: string): Promise<{
        id: string;
        ownerId: string;
    }>;
    updateMember(user: AuthenticatedUser, id: string, targetUserId: string, body: {
        role?: ConversationMemberRole;
        remove?: boolean;
    }): Promise<{
        id: string;
        userId: string;
        role: ConversationMemberRole;
        removed: boolean;
    }>;
    private requireMember;
    private requireViewer;
    private guardianObservedMemberships;
    private requireManager;
    private ensureAccessibleStudentConversations;
    private directAllowed;
    private shareConversation;
    private publicConversation;
    private publicMessage;
    private findAccessibleLinkedTask;
    private publicUser;
    private publicProfile;
    private changeUsername;
    private cleanText;
    private userSearch;
    private defaultPermissions;
    private normalizeEmojis;
}
