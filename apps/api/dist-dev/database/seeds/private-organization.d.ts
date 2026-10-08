import "reflect-metadata";
import { OrganizationType } from "../entities/organization.entity";
import { RelationshipType } from "../entities/user-relationship.entity";
import { UserRole } from "../entities/user.entity";
export type PrivateOrganizationSeedConfig = {
    production: boolean;
    organizationName: string;
    passwords: Record<PrivateOrganizationAccount, string>;
    studentNationalCode: string;
};
declare const PRIVATE_ORGANIZATION_ACCOUNTS: {
    readonly platformAdmin: {
        readonly username: "mobinkaram.platform";
        readonly firstName: "مدیر";
        readonly lastName: "سامانه";
        readonly role: UserRole.PLATFORM_ADMIN;
        readonly passwordEnv: "PRIVATE_ORG_PLATFORM_ADMIN_PASSWORD";
    };
    readonly organizationAdmin: {
        readonly username: "mobinkaram.orgadmin";
        readonly firstName: "مدیر";
        readonly lastName: "سازمان";
        readonly role: UserRole.ORGANIZATION_ADMIN;
        readonly passwordEnv: "PRIVATE_ORG_ORGANIZATION_ADMIN_PASSWORD";
    };
    readonly advisor: {
        readonly username: "mobinkaram";
        readonly firstName: "مبین";
        readonly lastName: "کرام";
        readonly role: UserRole.ADVISOR;
        readonly passwordEnv: "MOBINKARAM_PASSWORD";
        readonly relationship: RelationshipType.ADVISOR_OF;
    };
    readonly teacher: {
        readonly username: "mobinkaram.teacher";
        readonly firstName: "معلم";
        readonly lastName: "مه‌کارام";
        readonly role: UserRole.TEACHER;
        readonly passwordEnv: "PRIVATE_ORG_TEACHER_PASSWORD";
        readonly relationship: RelationshipType.TEACHER_OF;
    };
    readonly mentor: {
        readonly username: "mobinkaram.mentor";
        readonly firstName: "مربی";
        readonly lastName: "مه‌کارام";
        readonly role: UserRole.MENTOR;
        readonly passwordEnv: "PRIVATE_ORG_MENTOR_PASSWORD";
        readonly relationship: RelationshipType.MENTOR_OF;
    };
    readonly contentManager: {
        readonly username: "mobinkaram.content";
        readonly firstName: "مدیر محتوا";
        readonly lastName: "مه‌کارام";
        readonly role: UserRole.CONTENT_MANAGER;
        readonly passwordEnv: "PRIVATE_ORG_CONTENT_MANAGER_PASSWORD";
    };
    readonly guardian: {
        readonly username: "mahakaram.guardian";
        readonly firstName: "ولی";
        readonly lastName: "مه‌کارام";
        readonly role: UserRole.GUARDIAN;
        readonly passwordEnv: "PRIVATE_ORG_GUARDIAN_PASSWORD";
        readonly relationship: RelationshipType.GUARDIAN_OF;
    };
    readonly student: {
        readonly username: "mahakaram";
        readonly firstName: "مها";
        readonly lastName: "کرام";
        readonly role: UserRole.STUDENT;
        readonly passwordEnv: "MAHAKARAM_PASSWORD";
    };
};
type PrivateOrganizationAccount = keyof typeof PRIVATE_ORGANIZATION_ACCOUNTS;
export declare function resolvePrivateOrganizationSeedConfig(env?: NodeJS.ProcessEnv): PrivateOrganizationSeedConfig;
export declare function seedPrivateOrganization(config?: PrivateOrganizationSeedConfig): Promise<{
    mode: string;
    organization: {
        id: string;
        name: string;
        type: OrganizationType;
    };
    users: {
        username: string;
        role: UserRole.STUDENT | UserRole.GUARDIAN | UserRole.ADVISOR | UserRole.TEACHER | UserRole.MENTOR | UserRole.CONTENT_MANAGER | UserRole.ORGANIZATION_ADMIN | UserRole.PLATFORM_ADMIN;
    }[];
    student: {
        id: string;
        gradeId: number | null | undefined;
        trackId: string;
    };
    textbooks: number;
}>;
export {};
