import { Permission } from "./permission.entity";
import { Role } from "./role.entity";
export declare class RolePermission {
    id: string;
    role: Role;
    permission: Permission;
}
