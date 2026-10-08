import { RolePermission } from "./role-permission.entity";
export declare class Role {
    id: string;
    code: string;
    name: string;
    organizationScoped: boolean;
    permissions: RolePermission[];
}
