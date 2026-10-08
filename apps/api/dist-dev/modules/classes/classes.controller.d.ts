import { AuthenticatedUser } from "../auth";
import { SaveEducationClassDto, SetClassBooksDto, SetClassEnrollmentsDto, UpdateEducationClassDto } from "./classes.dto";
import { ClassesService } from "./classes.service";
export declare class ClassesController {
    private readonly classes;
    constructor(classes: ClassesService);
    list(actor: AuthenticatedUser, organizationId?: string): Promise<{
        ok: boolean;
        data: {
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
            gradeId: number;
            educationTypeId: string;
            trackId: string;
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
        }[];
    }>;
    assigned(actor: AuthenticatedUser, studentId?: string): Promise<{
        ok: boolean;
        data: {
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
            gradeId: number;
            educationTypeId: string;
            trackId: string;
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
                category: string;
                teacher: {
                    id: string;
                    name: string;
                };
            }[];
            enrollmentCount: number;
        }[];
    }>;
    create(actor: AuthenticatedUser, dto: SaveEducationClassDto): Promise<{
        ok: boolean;
        data: {
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
            gradeId: number;
            educationTypeId: string;
            trackId: string;
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
    }>;
    options(actor: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
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
                gradeId: number;
                educationTypeId: string;
                trackId: string;
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
        };
    }>;
    update(actor: AuthenticatedUser, id: string, dto: UpdateEducationClassDto): Promise<{
        ok: boolean;
        data: {
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
            gradeId: number;
            educationTypeId: string;
            trackId: string;
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
    }>;
    books(actor: AuthenticatedUser, id: string, dto: SetClassBooksDto): Promise<{
        ok: boolean;
        data: {
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
            gradeId: number;
            educationTypeId: string;
            trackId: string;
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
    }>;
    enrollments(actor: AuthenticatedUser, id: string, dto: SetClassEnrollmentsDto): Promise<{
        ok: boolean;
        data: {
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
            gradeId: number;
            educationTypeId: string;
            trackId: string;
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
    }>;
    remove(actor: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            deleted: boolean;
        };
    }>;
}
