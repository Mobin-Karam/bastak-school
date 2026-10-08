import { AuthenticatedUser } from "../auth";
import { CreateRelationshipDto, UpdateRelationshipDto } from "./dto/relationship.dto";
import { RelationshipsService } from "./relationships.service";
export declare class RelationshipsController {
    private service;
    constructor(service: RelationshipsService);
    list(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            id: string;
            type: import("../../database/entities/user-relationship.entity").RelationshipType;
            status: import("../../database/entities/user-relationship.entity").RelationshipStatus;
            fromUser: {
                id: string;
                username: string;
                firstName: string;
                lastName: string;
            };
            student: {
                id: string;
                name: string;
            } | undefined;
            organizationId: string | null;
            createdAt: Date;
            acceptedAt: Date | null | undefined;
            revokedAt: Date | null | undefined;
        }[];
    }>;
    create(user: AuthenticatedUser, dto: CreateRelationshipDto): Promise<{
        ok: boolean;
        data: {
            id: string;
            type: import("../../database/entities/user-relationship.entity").RelationshipType;
            status: import("../../database/entities/user-relationship.entity").RelationshipStatus;
            fromUser: {
                id: string;
                username: string;
                firstName: string;
                lastName: string;
            };
            student: {
                id: string;
                name: string;
            } | undefined;
            organizationId: string | null;
            createdAt: Date;
            acceptedAt: Date | null | undefined;
            revokedAt: Date | null | undefined;
        };
    }>;
    get(user: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            type: import("../../database/entities/user-relationship.entity").RelationshipType;
            status: import("../../database/entities/user-relationship.entity").RelationshipStatus;
            fromUser: {
                id: string;
                username: string;
                firstName: string;
                lastName: string;
            };
            student: {
                id: string;
                name: string;
            } | undefined;
            organizationId: string | null;
            createdAt: Date;
            acceptedAt: Date | null | undefined;
            revokedAt: Date | null | undefined;
        };
    }>;
    update(user: AuthenticatedUser, id: string, dto: UpdateRelationshipDto): Promise<{
        ok: boolean;
        data: {
            id: string;
            type: import("../../database/entities/user-relationship.entity").RelationshipType;
            status: import("../../database/entities/user-relationship.entity").RelationshipStatus;
            fromUser: {
                id: string;
                username: string;
                firstName: string;
                lastName: string;
            };
            student: {
                id: string;
                name: string;
            } | undefined;
            organizationId: string | null;
            createdAt: Date;
            acceptedAt: Date | null | undefined;
            revokedAt: Date | null | undefined;
        };
    }>;
    remove(user: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            type: import("../../database/entities/user-relationship.entity").RelationshipType;
            status: import("../../database/entities/user-relationship.entity").RelationshipStatus;
            fromUser: {
                id: string;
                username: string;
                firstName: string;
                lastName: string;
            };
            student: {
                id: string;
                name: string;
            } | undefined;
            organizationId: string | null;
            createdAt: Date;
            acceptedAt: Date | null | undefined;
            revokedAt: Date | null | undefined;
        };
    }>;
    accept(user: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            type: import("../../database/entities/user-relationship.entity").RelationshipType;
            status: import("../../database/entities/user-relationship.entity").RelationshipStatus;
            fromUser: {
                id: string;
                username: string;
                firstName: string;
                lastName: string;
            };
            student: {
                id: string;
                name: string;
            } | undefined;
            organizationId: string | null;
            createdAt: Date;
            acceptedAt: Date | null | undefined;
            revokedAt: Date | null | undefined;
        };
    }>;
    reject(user: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            type: import("../../database/entities/user-relationship.entity").RelationshipType;
            status: import("../../database/entities/user-relationship.entity").RelationshipStatus;
            fromUser: {
                id: string;
                username: string;
                firstName: string;
                lastName: string;
            };
            student: {
                id: string;
                name: string;
            } | undefined;
            organizationId: string | null;
            createdAt: Date;
            acceptedAt: Date | null | undefined;
            revokedAt: Date | null | undefined;
        };
    }>;
    forStudent(user: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            type: import("../../database/entities/user-relationship.entity").RelationshipType;
            status: import("../../database/entities/user-relationship.entity").RelationshipStatus;
            fromUser: {
                id: string;
                username: string;
                firstName: string;
                lastName: string;
            };
            student: {
                id: string;
                name: string;
            } | undefined;
            organizationId: string | null;
            createdAt: Date;
            acceptedAt: Date | null | undefined;
            revokedAt: Date | null | undefined;
        }[];
    }>;
    mine(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            student: {
                id: string;
                name: string;
            };
            relationship: {
                type: string;
                status: string;
            };
        }[];
    }>;
    guardianSelection(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            relationships: {
                id: string;
                type: import("../../database/entities/user-relationship.entity").RelationshipType;
                status: import("../../database/entities/user-relationship.entity").RelationshipStatus;
                fromUser: {
                    id: string;
                    username: string;
                    firstName: string;
                    lastName: string;
                };
                student: {
                    id: string;
                    name: string;
                } | undefined;
                organizationId: string | null;
                createdAt: Date;
                acceptedAt: Date | null | undefined;
                revokedAt: Date | null | undefined;
            }[];
            change: {
                allowed: boolean;
                nextAllowedAt: Date | null;
            };
        };
    }>;
    guardianCandidates(user: AuthenticatedUser, search?: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            username: string;
            name: string;
            organization: {
                id: string;
                name: string;
            } | null;
        }[];
    }>;
    requestGuardian(user: AuthenticatedUser, guardianUserId: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            type: import("../../database/entities/user-relationship.entity").RelationshipType;
            status: import("../../database/entities/user-relationship.entity").RelationshipStatus;
            fromUser: {
                id: string;
                username: string;
                firstName: string;
                lastName: string;
            };
            student: {
                id: string;
                name: string;
            } | undefined;
            organizationId: string | null;
            createdAt: Date;
            acceptedAt: Date | null | undefined;
            revokedAt: Date | null | undefined;
        };
    }>;
    cancelGuardian(user: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            cancelled: boolean;
        };
    }>;
    allowGuardianChange(user: AuthenticatedUser, studentId: string): Promise<{
        ok: boolean;
        data: {
            studentId: string;
            guardianChangeAllowed: boolean;
        };
    }>;
}
