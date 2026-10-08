import { ConversationMemberRole } from "../../database/entities/conversation-member.entity";
import { AuthenticatedUser } from "../auth";
import { ChatService } from "./chat.service";
export declare class ChatController {
    private chat;
    constructor(chat: ChatService);
    configuration(): Promise<{
        ok: boolean;
        data: {
            allowedEmojis: string[];
        };
    }>;
    updateConfiguration(u: AuthenticatedUser, emojis: unknown): Promise<{
        ok: boolean;
        data: {
            allowedEmojis: string[];
        };
    }>;
    myProfile(u: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
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
        };
    }>;
    updateProfile(u: AuthenticatedUser, body: {
        displayName?: unknown;
        bio?: unknown;
        avatarUrl?: unknown;
        username?: unknown;
    }): Promise<{
        ok: boolean;
        data: {
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
        };
    }>;
    profile(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
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
        };
    }>;
    allowUsernameChange(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            userId: string;
            usernameChangeAllowed: boolean;
        };
    }>;
    list(u: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
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
        }[];
    }>;
    direct(u: AuthenticatedUser, peer: string): Promise<{
        ok: boolean;
        data: {
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
        };
    }>;
    group(u: AuthenticatedUser, b: {
        title: string;
        description?: string;
        userIds?: string[];
        memberIds?: string[];
    }): Promise<{
        ok: boolean;
        data: {
            id: string;
            type: string;
            title: string;
        };
    }>;
    users(u: AuthenticatedUser, search?: string): Promise<{
        ok: boolean;
        data: {
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
    }>;
    detail(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
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
        };
    }>;
    messages(u: AuthenticatedUser, id: string, limit?: string, before?: string): Promise<{
        ok: boolean;
        data: {
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
        }[];
    }>;
    send(u: AuthenticatedUser, id: string, b: {
        text: string;
        replyToId?: string;
        mentions?: string[];
        taskId?: string;
    }): Promise<{
        ok: boolean;
        data: {
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
        };
    }>;
    read(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            conversationId: string;
            updated: number;
            unread: number;
            readOnly: boolean;
        } | {
            conversationId: string;
            updated: number;
            unread: number;
            readOnly?: undefined;
        };
    }>;
    edit(u: AuthenticatedUser, id: string, messageId: string, text: string): Promise<{
        ok: boolean;
        data: {
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
        };
    }>;
    remove(u: AuthenticatedUser, id: string, messageId: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            deleted: boolean;
        };
    }>;
    react(u: AuthenticatedUser, id: string, messageId: string, emoji: string): Promise<{
        ok: boolean;
        data: {
            active: boolean;
        };
    }>;
    mute(u: AuthenticatedUser, id: string, muted: boolean): Promise<{
        ok: boolean;
        data: {
            id: string;
            muted: boolean;
        };
    }>;
    mutePatch(u: AuthenticatedUser, id: string, muted: boolean): Promise<{
        ok: boolean;
        data: {
            id: string;
            muted: boolean;
        };
    }>;
    members(u: AuthenticatedUser, id: string, search?: string): Promise<{
        ok: boolean;
        data: {
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
        }[];
    }>;
    candidates(u: AuthenticatedUser, id: string, search?: string): Promise<{
        ok: boolean;
        data: {
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
    }>;
    addMember(u: AuthenticatedUser, id: string, target: string): Promise<{
        ok: boolean;
        data: {
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
        };
    }>;
    removeMember(u: AuthenticatedUser, id: string, target: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            userId: string;
            role: ConversationMemberRole;
            removed: boolean;
        };
    }>;
    updateGroup(u: AuthenticatedUser, id: string, body: {
        title?: string;
        description?: string;
        archived?: boolean;
    }): Promise<{
        ok: boolean;
        data: {
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
        };
    }>;
    permissions(u: AuthenticatedUser, id: string, body: Record<string, boolean>): Promise<{
        ok: boolean;
        data: Record<string, boolean>;
    }>;
    transfer(u: AuthenticatedUser, id: string, target: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            ownerId: string;
        };
    }>;
    leave(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            left: boolean;
        };
    }>;
    owner(u: AuthenticatedUser, id: string, target: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            ownerId: string;
        };
    }>;
    member(u: AuthenticatedUser, id: string, target: string, body: {
        role?: ConversationMemberRole;
        remove?: boolean;
    }): Promise<{
        ok: boolean;
        data: {
            id: string;
            userId: string;
            role: ConversationMemberRole;
            removed: boolean;
        };
    }>;
}
