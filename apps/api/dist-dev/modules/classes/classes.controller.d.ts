import { AuthenticatedUser } from "../auth";
import { ClassHistoryQueryDto, AddClassBookDto, SaveEducationClassDto, ClassTransferDto, SetClassBooksDto, SetClassEnrollmentsDto, UpdateEducationClassDto } from "./classes.dto";
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
            academicYearId: string | null;
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
            academicYearId: string | null;
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
            academicYearId: string | null;
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
    }>;
    previewTransfer(actor: AuthenticatedUser, dto: ClassTransferDto): Promise<{
        ok: boolean;
        data: {
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
        };
    }>;
    commitTransfer(actor: AuthenticatedUser, dto: ClassTransferDto): Promise<{
        ok: boolean;
        data: {
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
        };
    }>;
    exportTransfer(actor: AuthenticatedUser, organizationId: string): Promise<{
        ok: boolean;
        data: {
            code: string;
            name: string;
            schoolYear: string;
            capacity: number;
        }[];
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
                academicYearId: string | null;
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
            academicYearId: string | null;
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
    }>;
    addBook(actor: AuthenticatedUser, id: string, dto: AddClassBookDto): Promise<{
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
            academicYearId: string | null;
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
            academicYearId: string | null;
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
    }>;
    history(actor: AuthenticatedUser, id: string, page: ClassHistoryQueryDto): Promise<{
        ok: boolean;
        data: {
            items: import("../../database/entities").ClassEnrollmentHistory[];
            total: number;
            offset: number;
            limit: number;
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
            academicYearId: string | null;
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
    }>;
    remove(actor: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            deleted: boolean;
        };
    }>;
}
