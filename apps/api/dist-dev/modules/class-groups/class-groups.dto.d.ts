export declare const MAX_CLASS_GROUP_MEMBERS = 1000;
export declare class UpdateClassGroupDto {
    code?: string;
    name?: string;
    description?: string;
}
export declare class CreateClassGroupDto {
    classId: string;
    code: string;
    name: string;
    description?: string;
}
export declare class SetClassGroupMembersDto {
    studentIds: string[];
}
