import { AuthenticatedUser } from "../auth";
import { CreateClassGroupDto, SetClassGroupMembersDto, UpdateClassGroupDto } from "./class-groups.dto";
import { ClassGroupsService } from "./class-groups.service";
export declare class ClassGroupsController {
    private readonly groups;
    constructor(groups: ClassGroupsService);
    list(user: AuthenticatedUser, classId?: string, organizationId?: string): Promise<{
        ok: boolean;
        data: import("@moshaver/api-contract").ClassGroupSummary[];
    }>;
    classOptions(user: AuthenticatedUser, organizationId?: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            code: string;
            name: string;
            status: "ARCHIVED" | "ACTIVE";
            organizationId: string;
            organizationName: string;
            enrollmentCount: number;
        }[];
    }>;
    eligibleStudents(user: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            name: string;
            grade: string;
            major: string;
        }[];
    }>;
    create(user: AuthenticatedUser, dto: CreateClassGroupDto): Promise<{
        ok: boolean;
        data: import("@moshaver/api-contract").ClassGroupSummary;
    }>;
    update(user: AuthenticatedUser, id: string, dto: UpdateClassGroupDto): Promise<{
        ok: boolean;
        data: import("@moshaver/api-contract").ClassGroupSummary;
    }>;
    members(user: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            name: string;
            nationalCode: string | null;
            userId: string | null;
        }[];
    }>;
    setMembers(user: AuthenticatedUser, id: string, dto: SetClassGroupMembersDto): Promise<{
        ok: boolean;
        data: {
            groupId: string;
            count: number;
        };
    }>;
    remove(user: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            deleted: boolean;
        };
    }>;
}
