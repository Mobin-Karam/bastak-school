import { UpdateOrganizationAuthProfileDto } from "./dto/organization-profile.dto";
import { AuthenticatedUser } from "../auth";
import { AddMemberDto, CreateOrganizationDto, SetOrganizationEnabledDto, SetOrganizationFeaturesDto, UpdateMemberDto, UpdateOrganizationDto } from "./dto/organization.dto";
import { OrganizationsService } from "./organizations.service";
export declare class OrganizationsController {
    private service;
    constructor(service: OrganizationsService);
    publicProfiles(): Promise<{
        ok: boolean;
        data: import("@moshaver/api-contract").PublicOrganizationProfile[];
    }>;
    updateAuthProfile(user: AuthenticatedUser, id: string, dto: UpdateOrganizationAuthProfileDto): Promise<{
        ok: boolean;
        data: import("../../database/entities").Organization;
    }>;
    list(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: import("../../database/entities").Organization[];
    }>;
    get(user: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: import("../../database/entities").Organization;
    }>;
    create(user: AuthenticatedUser, dto: CreateOrganizationDto): Promise<{
        ok: boolean;
        data: import("../../database/entities").Organization;
    }>;
    update(user: AuthenticatedUser, id: string, dto: UpdateOrganizationDto): Promise<{
        ok: boolean;
        data: import("../../database/entities").Organization;
    }>;
    setEnabled(user: AuthenticatedUser, id: string, dto: SetOrganizationEnabledDto): Promise<{
        ok: boolean;
        data: import("../../database/entities").Organization;
    }>;
    setFeatures(user: AuthenticatedUser, id: string, dto: SetOrganizationFeaturesDto): Promise<{
        ok: boolean;
        data: import("../../database/entities").Organization;
    }>;
    archive(user: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            status: import("../../database/entities/organization.entity").OrganizationStatus.ARCHIVED;
        };
    }>;
    members(user: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            user: {
                id: string;
                username: string;
                firstName: string;
                lastName: string;
                status: import("../../database/entities/user.entity").UserStatus;
            };
            status: import("../../database/entities/organization-membership.entity").MembershipStatus;
            roles: string[];
        }[];
    }>;
    add(user: AuthenticatedUser, id: string, dto: AddMemberDto): Promise<{
        ok: boolean;
        data: {
            membershipId: string;
            userId: string;
            roles: string[];
        };
    }>;
    updateMember(user: AuthenticatedUser, id: string, userId: string, dto: UpdateMemberDto): Promise<{
        ok: boolean;
        data: {
            userId: string;
            status: import("../../database/entities/organization-membership.entity").MembershipStatus;
            roles: string[] | undefined;
        };
    }>;
    remove(user: AuthenticatedUser, id: string, userId: string): Promise<{
        ok: boolean;
        data: {
            removed: boolean;
        };
    }>;
}
