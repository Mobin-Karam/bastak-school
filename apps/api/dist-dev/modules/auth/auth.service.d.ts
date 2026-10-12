import { ConfigService } from "@nestjs/config";
import { Repository } from "typeorm";
import { Session } from "../../database/entities/session.entity";
import { User } from "../../database/entities/user.entity";
import { Student } from "../../database/entities/student.entity";
import { UserStatus } from "../../database/entities/user.entity";
import { AuthorizationService } from "../authorization";
import { OrganizationMembership } from "../../database/entities/organization-membership.entity";
import { Organization } from "../../database/entities/organization.entity";
import { AccountChangeRequest } from "../../database/entities/account-change-request.entity";
import { LoginThrottleService } from "./login-throttle.service";
export type AuthenticatedUser = {
    id: string;
    username: string;
    role: string;
    sessionId: string;
    roles?: string[];
    capabilities?: string[];
    membershipIds?: string[];
    organizationIds?: string[];
    activeOrganizationId?: string;
};
export declare class AuthService {
    private readonly users;
    private readonly sessions;
    private readonly students;
    private readonly config;
    private readonly memberships?;
    private readonly authorization?;
    private readonly throttle?;
    private readonly organizations?;
    private readonly accountChangeRequests?;
    private readonly credentials;
    constructor(users: Repository<User>, sessions: Repository<Session>, students: Repository<Student>, config: ConfigService, memberships?: Repository<OrganizationMembership> | undefined, authorization?: AuthorizationService | undefined, throttle?: LoginThrottleService | undefined, organizations?: Repository<Organization> | undefined, accountChangeRequests?: Repository<AccountChangeRequest> | undefined);
    checkPhone(phoneNumber: string, ip?: string): Promise<{
        exists: boolean;
    }>;
    login(phoneNumber: string, password: string, ip?: string): Promise<{
        session: Session;
        user: User;
        accessToken: string;
        refreshToken: string;
        csrfToken: string;
        expiresAt: Date;
        refreshExpiresAt: Date;
    }>;
    refresh(refreshToken?: string, csrfToken?: string): Promise<{
        session: Session;
        user: User;
        accessToken: string;
        refreshToken: string;
        csrfToken: string;
        expiresAt: Date;
        refreshExpiresAt: Date;
    }>;
    userFromToken(token?: string, requestedRole?: string, requestedOrganizationId?: string): Promise<AuthenticatedUser | null>;
    logout(token?: string, refreshToken?: string): Promise<void>;
    me(user: AuthenticatedUser): Promise<{
        id: string;
        username: string;
        role: string;
        roles: string[] | undefined;
        capabilities: string[] | undefined;
        csrfToken: string | undefined;
        phoneNumber: string | null;
        phoneNumberChangeAvailable: boolean;
    }>;
    context(user: AuthenticatedUser, activeOrganizationId?: string): Promise<{
        user: {
            id: string;
            username: string;
            firstName: string;
            lastName: string;
            status: UserStatus;
            isPlatformOwner: boolean;
            locale: string;
            timezone: string;
        };
        roles: string[];
        capabilities: string[];
        workContexts: {
            role: string;
            capabilities: string[];
        }[];
        memberships: {
            membershipId: string;
            id: string;
            name: string;
            type: import("../../database/entities/organization.entity").OrganizationType;
        }[];
        activeOrganization: {
            membershipId: string;
            id: string;
            name: string;
            type: import("../../database/entities/organization.entity").OrganizationType;
        } | null;
        availableOrganizations: {
            membershipId: string;
            id: string;
            name: string;
            type: import("../../database/entities/organization.entity").OrganizationType;
        }[];
    }>;
    changePassword(user: AuthenticatedUser, currentPassword: string, newPassword: string): Promise<{
        changed: boolean;
        otherSessionsRevoked: boolean;
    }>;
    changeOwnPhoneNumber(user: AuthenticatedUser, phoneNumber: string): Promise<{
        phoneNumber: string;
        changed: boolean;
        otherSessionsRevoked: boolean;
        requiresReviewForNextChange: boolean;
    }>;
    createPhoneNumberChangeRequest(user: AuthenticatedUser, organizationId: string, phoneNumber: string, reason?: string): Promise<{
        id: string;
        status: import("../../database/entities/account-change-request.entity").AccountChangeRequestStatus;
        requestedValue: string;
        createdAt: Date;
    }>;
    listPhoneNumberChangeRequests(user: AuthenticatedUser, organizationId?: string): Promise<AccountChangeRequest[]>;
    reviewPhoneNumberChangeRequest(user: AuthenticatedUser, id: string, approved: boolean, reviewNote?: string): Promise<{
        id: string;
        status: "APPROVED" | "REJECTED";
        reviewedAt: Date;
    }>;
    listSessions(user: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        expiresAt: Date;
        current: boolean;
    }[]>;
    revokeSession(user: AuthenticatedUser, id: string): Promise<{
        id: string;
        revoked: boolean;
    }>;
    verifyCsrf(sessionId: string, csrfToken: string): Promise<boolean>;
    private newCredentials;
    private hasActiveStudentAccount;
    private isStudentOrGuardian;
}
