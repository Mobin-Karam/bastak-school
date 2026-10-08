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
import { EducationCatalogService } from "../education-catalog/education-catalog.service";
import { SaveEducationClassDto, SetClassBooksDto, SetClassEnrollmentsDto, UpdateEducationClassDto } from "./classes.dto";
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
        };
        code: string;
        name: string;
        schoolYear: string;
        gradeId: number;
        educationTypeId: string;
        trackId: string;
        capacity: number;
        status: "ARCHIVED" | "ACTIVE";
        description: string;
        advisor: {
            id: string;
            name: string;
        } | null;
        books: {
            id: string;
            bookId: string;
            title: string;
            category: string;
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
        };
        code: string;
        name: string;
        schoolYear: string;
        gradeId: number;
        educationTypeId: string;
        trackId: string;
        capacity: number;
        status: "ARCHIVED" | "ACTIVE";
        description: string;
        advisor: {
            id: string;
            name: string;
        } | null;
        books: {
            id: string;
            bookId: string;
            title: string;
            category: string;
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
            };
            code: string;
            name: string;
            schoolYear: string;
            gradeId: number;
            educationTypeId: string;
            trackId: string;
            capacity: number;
            status: "ARCHIVED" | "ACTIVE";
            description: string;
            advisor: {
                id: string;
                name: string;
            } | null;
            books: {
                id: string;
                bookId: string;
                title: string;
                category: string;
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
        };
        code: string;
        name: string;
        schoolYear: string;
        gradeId: number;
        educationTypeId: string;
        trackId: string;
        capacity: number;
        status: "ARCHIVED" | "ACTIVE";
        description: string;
        advisor: {
            id: string;
            name: string;
        } | null;
        books: {
            id: string;
            bookId: string;
            title: string;
            category: string;
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
        };
        code: string;
        name: string;
        schoolYear: string;
        gradeId: number;
        educationTypeId: string;
        trackId: string;
        capacity: number;
        status: "ARCHIVED" | "ACTIVE";
        description: string;
        advisor: {
            id: string;
            name: string;
        } | null;
        books: {
            id: string;
            bookId: string;
            title: string;
            category: string;
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
    remove(actor: AuthenticatedUser, id: string): Promise<{
        deleted: boolean;
    }>;
    setBooks(actor: AuthenticatedUser, id: string, dto: SetClassBooksDto): Promise<{
        id: string;
        organization: {
            id: string;
            name: string;
        };
        code: string;
        name: string;
        schoolYear: string;
        gradeId: number;
        educationTypeId: string;
        trackId: string;
        capacity: number;
        status: "ARCHIVED" | "ACTIVE";
        description: string;
        advisor: {
            id: string;
            name: string;
        } | null;
        books: {
            id: string;
            bookId: string;
            title: string;
            category: string;
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
        };
        code: string;
        name: string;
        schoolYear: string;
        gradeId: number;
        educationTypeId: string;
        trackId: string;
        capacity: number;
        status: "ARCHIVED" | "ACTIVE";
        description: string;
        advisor: {
            id: string;
            name: string;
        } | null;
        books: {
            id: string;
            bookId: string;
            title: string;
            category: string;
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
    private resolveTeacher;
    private resolveAdvisor;
    private staffMember;
    private staffForOrganization;
    private eligibleStudents;
    private assertEligibleStudent;
    private view;
    private studentView;
}
