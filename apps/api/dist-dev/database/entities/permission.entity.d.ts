import { RolePermission } from "./role-permission.entity";
export declare class Permission {
    id: string;
    code: string;
    description: string;
    roles: RolePermission[];
}
