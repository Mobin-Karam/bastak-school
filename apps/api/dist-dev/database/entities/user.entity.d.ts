import { Session } from "./session.entity";
import { Student } from "./student.entity";
import { ChatMessage } from "./chat-message.entity";
import { AuditLog } from "./audit-log.entity";
export declare enum UserRole {
    ADMIN = "ADMIN",
    STUDENT = "STUDENT",
    GUARDIAN = "GUARDIAN",
    ADVISOR = "ADVISOR",
    TEACHER = "TEACHER",
    MENTOR = "MENTOR",
    CONTENT_MANAGER = "CONTENT_MANAGER",
    ORGANIZATION_ADMIN = "ORGANIZATION_ADMIN",
    PLATFORM_ADMIN = "PLATFORM_ADMIN"
}
export declare enum UserStatus {
    ACTIVE = "ACTIVE",
    DISABLED = "DISABLED",
    ARCHIVED = "ARCHIVED"
}
export declare class User {
    id: string;
    username: string;
    phoneNumber?: string | null;
    email?: string | null;
    passwordHash: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    status: UserStatus;
    isPlatformOwner: boolean;
    locale: string;
    timezone: string;
    chatDisplayName: string;
    chatBio: string;
    chatAvatarUrl: string;
    usernameChangeCount: number;
    usernameChangedAt?: Date | null;
    phoneNumberChangeCount: number;
    createdAt: Date;
    updatedAt: Date;
    sessions: Session[];
    student?: Student;
    sentMessages: ChatMessage[];
    auditLogs: AuditLog[];
}
