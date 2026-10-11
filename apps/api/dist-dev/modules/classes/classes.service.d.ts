import { Repository } from "typeorm";
import { EducationBook } from "../../database/entities/education-book.entity";
import { EducationClassBook } from "../../database/entities/education-class-book.entity";
import { EducationClassEnrollment } from "../../database/entities/education-class-enrollment.entity";
import { EducationClass } from "../../database/entities/education-class.entity";
import { OrganizationMembership } from "../../database/entities/organization-membership.entity";
import { Organization } from "../../database/entities/organization.entity";
import { Student } from "../../database/entities/student.entity";
import { UserRoleAssignment } from "../../database/entities/user-role-assignment.entity";
import { User } from "../../database/entities/user.entity";
import { AuthenticatedUser } from "../auth";
import { AuthorizationService } from "../authorization";
import { EducationCatalogService } from "../education-catalog";
import { AddClassBookDto, SaveEducationClassDto, ClassTransferDto, SetClassBooksDto, SetClassEnrollmentsDto, UpdateEducationClassDto } from "./classes.dto";
export declare class ClassesService {
    private readonly classes;
    private readonly classBooks;
    private readonly enrollments;
    private readonly books;
    private readonly organizations;
    private readonly memberships;
    private readonly students;
    private readonly users;
    private readonly roleAssignments;
    private readonly authorization;
    private readonly catalog;
    constructor(classes: Repository<EducationClass>, classBooks: Repository<EducationClassBook>, enrollments: Repository<EducationClassEnrollment>, books: Repository<EducationBook>, organizations: Repository<Organization>, memberships: Repository<OrganizationMembership>, students: Repository<Student>, users: Repository<User>, roleAssignments: Repository<UserRoleAssignment>, authorization: AuthorizationService, catalog: EducationCatalogService);
    list(actor: AuthenticatedUser, organizationId?: string): Promise<{
        id: string;
        organization: {
            id: string;
            name: string;
            type: import("../../database/entities/organization.entity").OrganizationType;
            status: import("../../database/entities/organization.entity").OrganizationStatus;
        };
        code: string;
        name: string;
        schoolYear: string;
        gradeId: number | null;
        educationTypeId: string | null;
        trackId: string | null;
        capacity: number;
        status: "ACTIVE" | "ARCHIVED";
        description: string;
        advisor: {
            id: string;
            name: string;
        } | null;
        books: {
            id: string;
            bookId: string;
            title: string;
            code: string;
            teacher: {
                id: string;
                name: string;
            };
        }[];
        enrollmentCount: number;
        students: {
            id: string;
            name: string;
            grade: string;
            major: string;
        }[];
    }[]>;
    assigned(actor: AuthenticatedUser, studentId?: string): Promise<{
        students: undefined;
        id: string;
        organization: {
            id: string;
            name: string;
            type: import("../../database/entities/organization.entity").OrganizationType;
            status: import("../../database/entities/organization.entity").OrganizationStatus;
        };
        code: string;
        name: string;
        schoolYear: string;
        gradeId: number | null;
        educationTypeId: string | null;
        trackId: string | null;
        capacity: number;
        status: "ACTIVE" | "ARCHIVED";
        description: string;
        advisor: {
            id: string;
            name: string;
        } | null;
        books: {
            id: string;
            bookId: string;
            title: string;
            code: string;
            teacher: {
                id: string;
                name: string;
            };
        }[];
        enrollmentCount: number;
    }[]>;
    options(actor: AuthenticatedUser, id: string): Promise<{
        classroom: {
            id: string;
            organization: {
                id: string;
                name: string;
                type: import("../../database/entities/organization.entity").OrganizationType;
                status: import("../../database/entities/organization.entity").OrganizationStatus;
            };
            code: string;
            name: string;
            schoolYear: string;
            gradeId: number | null;
            educationTypeId: string | null;
            trackId: string | null;
            capacity: number;
            status: "ACTIVE" | "ARCHIVED";
            description: string;
            advisor: {
                id: string;
                name: string;
            } | null;
            books: {
                id: string;
                bookId: string;
                title: string;
                code: string;
                teacher: {
                    id: string;
                    name: string;
                };
            }[];
            enrollmentCount: number;
            students: {
                id: string;
                name: string;
                grade: string;
                major: string;
            }[];
        };
        books: {
            id: string;
            title: string;
            category: string;
            track: string;
        }[];
        teachers: {
            id: string;
            name: string;
            roles: string[];
        }[];
        advisors: {
            id: string;
            name: string;
            roles: string[];
        }[];
        eligibleStudents: {
            id: string;
            name: string;
            grade: string;
            major: string;
        }[];
    }>;
    create(actor: AuthenticatedUser, dto: SaveEducationClassDto): Promise<{
        id: string;
        organization: {
            id: string;
            name: string;
            type: import("../../database/entities/organization.entity").OrganizationType;
            status: import("../../database/entities/organization.entity").OrganizationStatus;
        };
        code: string;
        name: string;
        schoolYear: string;
        gradeId: number | null;
        educationTypeId: string | null;
        trackId: string | null;
        capacity: number;
        status: "ACTIVE" | "ARCHIVED";
        description: string;
        advisor: {
            id: string;
            name: string;
        } | null;
        books: {
            id: string;
            bookId: string;
            title: string;
            code: string;
            teacher: {
                id: string;
                name: string;
            };
        }[];
        enrollmentCount: number;
        students: {
            id: string;
            name: string;
            grade: string;
            major: string;
        }[];
    }>;
    update(actor: AuthenticatedUser, id: string, dto: UpdateEducationClassDto): Promise<{
        id: string;
        organization: {
            id: string;
            name: string;
            type: import("../../database/entities/organization.entity").OrganizationType;
            status: import("../../database/entities/organization.entity").OrganizationStatus;
        };
        code: string;
        name: string;
        schoolYear: string;
        gradeId: number | null;
        educationTypeId: string | null;
        trackId: string | null;
        capacity: number;
        status: "ACTIVE" | "ARCHIVED";
        description: string;
        advisor: {
            id: string;
            name: string;
        } | null;
        books: {
            id: string;
            bookId: string;
            title: string;
            code: string;
            teacher: {
                id: string;
                name: string;
            };
        }[];
        enrollmentCount: number;
        students: {
            id: string;
            name: string;
            grade: string;
            major: string;
        }[];
    }>;
    previewTransfer(actor: AuthenticatedUser, dto: ClassTransferDto): Promise<{
        total: number;
        valid: number;
        invalid: number;
        rows: {
            row: number;
            code: string;
            name: string;
            schoolYear: string;
            capacity: number | undefined;
            errors: string[];
        }[];
    }>;
    commitTransfer(actor: AuthenticatedUser, dto: ClassTransferDto): Promise<{
        committed: boolean;
        count: number;
        invalid: number;
        rows: {
            row: number;
            code: string;
            name: string;
            schoolYear: string;
            capacity: number | undefined;
            errors: string[];
        }[];
    } | {
        committed: boolean;
        count: number;
        invalid: number;
        rows?: undefined;
    }>;
    exportTransfer(actor: AuthenticatedUser, organizationId: string): Promise<{
        code: string;
        name: string;
        schoolYear: string;
        capacity: number;
    }[]>;
    remove(actor: AuthenticatedUser, id: string): Promise<{
        deleted: boolean;
    }>;
    addBook(actor: AuthenticatedUser, id: string, dto: AddClassBookDto): Promise<{
        id: string;
        organization: {
            id: string;
            name: string;
            type: import("../../database/entities/organization.entity").OrganizationType;
            status: import("../../database/entities/organization.entity").OrganizationStatus;
        };
        code: string;
        name: string;
        schoolYear: string;
        gradeId: number | null;
        educationTypeId: string | null;
        trackId: string | null;
        capacity: number;
        status: "ACTIVE" | "ARCHIVED";
        description: string;
        advisor: {
            id: string;
            name: string;
        } | null;
        books: {
            id: string;
            bookId: string;
            title: string;
            code: string;
            teacher: {
                id: string;
                name: string;
            };
        }[];
        enrollmentCount: number;
        students: {
            id: string;
            name: string;
            grade: string;
            major: string;
        }[];
    }>;
    setBooks(actor: AuthenticatedUser, id: string, dto: SetClassBooksDto): Promise<{
        id: string;
        organization: {
            id: string;
            name: string;
            type: import("../../database/entities/organization.entity").OrganizationType;
            status: import("../../database/entities/organization.entity").OrganizationStatus;
        };
        code: string;
        name: string;
        schoolYear: string;
        gradeId: number | null;
        educationTypeId: string | null;
        trackId: string | null;
        capacity: number;
        status: "ACTIVE" | "ARCHIVED";
        description: string;
        advisor: {
            id: string;
            name: string;
        } | null;
        books: {
            id: string;
            bookId: string;
            title: string;
            code: string;
            teacher: {
                id: string;
                name: string;
            };
        }[];
        enrollmentCount: number;
        students: {
            id: string;
            name: string;
            grade: string;
            major: string;
        }[];
    }>;
    setEnrollments(actor: AuthenticatedUser, id: string, dto: SetClassEnrollmentsDto): Promise<{
        id: string;
        organization: {
            id: string;
            name: string;
            type: import("../../database/entities/organization.entity").OrganizationType;
            status: import("../../database/entities/organization.entity").OrganizationStatus;
        };
        code: string;
        name: string;
        schoolYear: string;
        gradeId: number | null;
        educationTypeId: string | null;
        trackId: string | null;
        capacity: number;
        status: "ACTIVE" | "ARCHIVED";
        description: string;
        advisor: {
            id: string;
            name: string;
        } | null;
        books: {
            id: string;
            bookId: string;
            title: string;
            code: string;
            teacher: {
                id: string;
                name: string;
            };
        }[];
        enrollmentCount: number;
        students: {
            id: string;
            name: string;
            grade: string;
            major: string;
        }[];
    }>;
    private requireClass;
    private load;
    private context;
    private isPlatform;
    private canReadOrganization;
    private canManageOrganization;
    private canSeeClass;
    private forbidden;
    private requireTransferOrganization;
    private inspectTransfer;
    private assertSchoolYear;
    private isAcademicYear;
    private normalizedAcademicYear;
    private resolveTeacher;
    private resolveAdvisor;
    private staffMember;
    private staffForOrganization;
    private eligibleStudents;
    private assertEligibleStudent;
    private view;
    private hasCurriculumProfile;
    private studentView;
}
