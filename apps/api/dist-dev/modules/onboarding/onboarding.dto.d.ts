export declare class StudentSignupDto {
    organizationId: string;
    phoneNumber: string;
    password: string;
    firstName: string;
    lastName: string;
}
export declare class SetPlatformStudentSignupDto {
    enabled: boolean;
}
export declare class SetOrganizationStudentSignupDto {
    managedByOrganization?: boolean;
    enabled?: boolean;
    limit?: number;
}
export declare class AssignStudentOnboardingDto {
    mode?: "AUTO" | "MANUAL";
    organizationId?: string;
    advisorUserId?: string;
}
export declare class PlatformBootstrapDto {
    phoneNumber: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}
