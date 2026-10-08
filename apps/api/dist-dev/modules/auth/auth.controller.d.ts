import { ConfigService } from "@nestjs/config";
import { FastifyReply, FastifyRequest } from "fastify";
import { AuthenticatedUser, AuthService } from "./auth.service";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { LoginDto } from "./dto/login.dto";
import { CreatePhoneNumberChangeRequestDto, ChangeOwnPhoneNumberDto, ReviewPhoneNumberChangeRequestDto } from "./dto/phone-number-change.dto";
export declare class AuthController {
    private readonly auth;
    private readonly config;
    constructor(auth: AuthService, config: ConfigService);
    login(dto: LoginDto, req: FastifyRequest, res: FastifyReply): Promise<{
        ok: boolean;
        data: {
            user: {
                id: string;
                username: string;
                role: import("../../database/entities/user.entity").UserRole;
            };
            csrfToken: string;
            expiresAt: Date;
            refreshExpiresAt: Date;
        };
    }>;
    refresh(req: FastifyRequest, res: FastifyReply): Promise<{
        ok: boolean;
        data: {
            csrfToken: string;
            expiresAt: Date;
            refreshExpiresAt: Date;
        };
    }>;
    me(user: AuthenticatedUser | null): Promise<{
        ok: boolean;
        data: {
            id: string;
            username: string;
            role: string;
            roles: string[] | undefined;
            capabilities: string[] | undefined;
            csrfToken: string | undefined;
            phoneNumber: string | null;
            phoneNumberChangeAvailable: boolean;
        };
    }>;
    changePassword(user: AuthenticatedUser | null, dto: ChangePasswordDto): Promise<{
        ok: boolean;
        data: {
            changed: boolean;
            otherSessionsRevoked: boolean;
        };
    }>;
    changeOwnPhoneNumber(user: AuthenticatedUser | null, dto: ChangeOwnPhoneNumberDto): Promise<{
        ok: boolean;
        data: {
            phoneNumber: string;
            changed: boolean;
            otherSessionsRevoked: boolean;
            requiresReviewForNextChange: boolean;
        };
    }>;
    requestPhoneNumberChange(user: AuthenticatedUser | null, dto: CreatePhoneNumberChangeRequestDto): Promise<{
        ok: boolean;
        data: {
            id: string;
            status: import("../../database/entities/account-change-request.entity").AccountChangeRequestStatus;
            requestedValue: string;
            createdAt: Date;
        };
    }>;
    phoneChangeRequests(user: AuthenticatedUser, req: FastifyRequest): Promise<{
        ok: boolean;
        data: import("../../database/entities").AccountChangeRequest[];
    }>;
    approvePhoneChange(user: AuthenticatedUser, id: string, dto: ReviewPhoneNumberChangeRequestDto): Promise<{
        ok: boolean;
        data: {
            id: string;
            status: "APPROVED" | "REJECTED";
            reviewedAt: Date;
        };
    }>;
    rejectPhoneChange(user: AuthenticatedUser, id: string, dto: ReviewPhoneNumberChangeRequestDto): Promise<{
        ok: boolean;
        data: {
            id: string;
            status: "APPROVED" | "REJECTED";
            reviewedAt: Date;
        };
    }>;
    logout(req: FastifyRequest, res: FastifyReply): Promise<{
        ok: boolean;
        data: {
            loggedOut: boolean;
        };
    }>;
    sessions(user: AuthenticatedUser | null): Promise<{
        ok: boolean;
        data: {
            id: string;
            createdAt: Date;
            expiresAt: Date;
            current: boolean;
        }[];
    }>;
    revokeSession(user: AuthenticatedUser | null, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            revoked: boolean;
        };
    }>;
    private setAuthCookies;
}
