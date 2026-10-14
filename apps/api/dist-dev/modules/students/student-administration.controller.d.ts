import { AuthenticatedUser } from "../auth";
import { CreateStudentDto, ResetStudentPasswordDto, UpdateStudentDto } from "./dto/student-admin.dto";
import { StudentAdministrationService } from "./student-administration.service";
import { CreateLearningItemDto, ReviewLearningItemDto, UpdateLearningItemDto } from "./dto/learning.dto";
import { UpdateTaskIssueDto } from "./dto/task-issue.dto";
export declare class StudentAdministrationController {
    private service;
    constructor(service: StudentAdministrationService);
    list(u: AuthenticatedUser, organizationId?: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            name: string;
            gradeId: number | null | undefined;
            learnerProfile: "school" | "independent";
            independentType: "adult" | "gap_year" | "homeschool" | "other" | null | undefined;
            learningLevel: string;
            educationTypeId: string;
            trackId: string;
            grade: string;
            major: string;
            targetUniversity: string;
            targetField: string;
            targetRank: string;
            dailyCapacity: string;
            nationalCode: string | null;
            birthDate: string | null;
            governmentSchool: string | null;
            classId: string | null;
            className: string | null;
            accountStatus: "active" | "inactive" | "archived";
            registrationStatus: "APPROVED" | "REJECTED" | "ACCOUNT_CREATED" | "IN_PROGRESS" | "WAITING_REVIEW" | "NEEDS_CORRECTION" | "ACTIVE";
            profileComplete: boolean;
            organization: {
                id: string;
                name: string;
            } | null;
            phoneNumber: string | null;
            user: {
                id: string;
                username: string;
                phoneNumber: string | null;
                status: import("../../database/entities/user.entity").UserStatus;
            } | null;
            createdAt: Date;
            updatedAt: Date;
        }[];
    }>;
    create(u: AuthenticatedUser, d: CreateStudentDto): Promise<{
        ok: boolean;
        data: {
            id: string;
            name: string;
            gradeId: number | null | undefined;
            learnerProfile: "school" | "independent";
            independentType: "adult" | "gap_year" | "homeschool" | "other" | null | undefined;
            learningLevel: string;
            educationTypeId: string;
            trackId: string;
            grade: string;
            major: string;
            targetUniversity: string;
            targetField: string;
            targetRank: string;
            dailyCapacity: string;
            nationalCode: string | null;
            birthDate: string | null;
            governmentSchool: string | null;
            classId: string | null;
            className: string | null;
            accountStatus: "active" | "inactive" | "archived";
            registrationStatus: "APPROVED" | "REJECTED" | "ACCOUNT_CREATED" | "IN_PROGRESS" | "WAITING_REVIEW" | "NEEDS_CORRECTION" | "ACTIVE";
            profileComplete: boolean;
            organization: {
                id: string;
                name: string;
            } | null;
            phoneNumber: string | null;
            user: {
                id: string;
                username: string;
                phoneNumber: string | null;
                status: import("../../database/entities/user.entity").UserStatus;
            } | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    get(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            name: string;
            gradeId: number | null | undefined;
            learnerProfile: "school" | "independent";
            independentType: "adult" | "gap_year" | "homeschool" | "other" | null | undefined;
            learningLevel: string;
            educationTypeId: string;
            trackId: string;
            grade: string;
            major: string;
            targetUniversity: string;
            targetField: string;
            targetRank: string;
            dailyCapacity: string;
            nationalCode: string | null;
            birthDate: string | null;
            governmentSchool: string | null;
            classId: string | null;
            className: string | null;
            accountStatus: "active" | "inactive" | "archived";
            registrationStatus: "APPROVED" | "REJECTED" | "ACCOUNT_CREATED" | "IN_PROGRESS" | "WAITING_REVIEW" | "NEEDS_CORRECTION" | "ACTIVE";
            profileComplete: boolean;
            organization: {
                id: string;
                name: string;
            } | null;
            phoneNumber: string | null;
            user: {
                id: string;
                username: string;
                phoneNumber: string | null;
                status: import("../../database/entities/user.entity").UserStatus;
            } | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    overview(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            name: string;
            gradeId: number | null | undefined;
            learnerProfile: "school" | "independent";
            independentType: "adult" | "gap_year" | "homeschool" | "other" | null | undefined;
            learningLevel: string;
            educationTypeId: string;
            trackId: string;
            grade: string;
            major: string;
            targetUniversity: string;
            targetField: string;
            targetRank: string;
            dailyCapacity: string;
            nationalCode: string | null;
            birthDate: string | null;
            governmentSchool: string | null;
            classId: string | null;
            className: string | null;
            accountStatus: "active" | "inactive" | "archived";
            registrationStatus: "APPROVED" | "REJECTED" | "ACCOUNT_CREATED" | "IN_PROGRESS" | "WAITING_REVIEW" | "NEEDS_CORRECTION" | "ACTIVE";
            profileComplete: boolean;
            organization: {
                id: string;
                name: string;
            } | null;
            phoneNumber: string | null;
            user: {
                id: string;
                username: string;
                phoneNumber: string | null;
                status: import("../../database/entities/user.entity").UserStatus;
            } | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    profile(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            identity: {
                firstName: string;
                lastName: string;
                fullName: string;
                nationalCode: string | null;
                phoneNumber: string | null;
                email: string | null;
                profilePhoto: string;
            };
            contact: {
                phoneNumber: string | null;
                email: string | null;
            };
            education: {
                learnerProfile: "school" | "independent";
                independentType: "adult" | "gap_year" | "homeschool" | "other" | null;
                learningLevel: string;
                gradeId: number | null;
                educationTypeId: string;
                trackId: string;
                grade: string;
                major: string;
                targetUniversity: string;
                targetField: string;
                targetRank: string;
                dailyCapacity: string;
            };
            attendanceSummary: {
                totalSessions: number;
                present: number;
                absent: number;
                late: number;
                excused: number;
            };
            recentAttendance: {
                id: string;
                sessionId: string;
                status: import("../../database/entities").AttendanceStatus;
                sessionDate: string;
                contextType: import("../../database/entities/attendance-session.entity").AttendanceContextType;
                contextId: string;
                organizationId: string;
                recordedAt: string;
            }[];
            id: string;
            name: string;
            gradeId: number | null | undefined;
            learnerProfile: "school" | "independent";
            independentType: "adult" | "gap_year" | "homeschool" | "other" | null | undefined;
            learningLevel: string;
            educationTypeId: string;
            trackId: string;
            grade: string;
            major: string;
            targetUniversity: string;
            targetField: string;
            targetRank: string;
            dailyCapacity: string;
            nationalCode: string | null;
            birthDate: string | null;
            governmentSchool: string | null;
            classId: string | null;
            className: string | null;
            accountStatus: "active" | "inactive" | "archived";
            registrationStatus: "APPROVED" | "REJECTED" | "ACCOUNT_CREATED" | "IN_PROGRESS" | "WAITING_REVIEW" | "NEEDS_CORRECTION" | "ACTIVE";
            profileComplete: boolean;
            organization: {
                id: string;
                name: string;
            } | null;
            phoneNumber: string | null;
            user: {
                id: string;
                username: string;
                phoneNumber: string | null;
                status: import("../../database/entities/user.entity").UserStatus;
            } | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    updateProfile(u: AuthenticatedUser, id: string, d: UpdateStudentDto): Promise<{
        ok: boolean;
        data: {
            identity: {
                firstName: string;
                lastName: string;
                fullName: string;
                nationalCode: string | null;
                phoneNumber: string | null;
                email: string | null;
                profilePhoto: string;
            };
            contact: {
                phoneNumber: string | null;
                email: string | null;
            };
            education: {
                learnerProfile: "school" | "independent";
                independentType: "adult" | "gap_year" | "homeschool" | "other" | null;
                learningLevel: string;
                gradeId: number | null;
                educationTypeId: string;
                trackId: string;
                grade: string;
                major: string;
                targetUniversity: string;
                targetField: string;
                targetRank: string;
                dailyCapacity: string;
            };
            attendanceSummary: {
                totalSessions: number;
                present: number;
                absent: number;
                late: number;
                excused: number;
            };
            recentAttendance: {
                id: string;
                sessionId: string;
                status: import("../../database/entities").AttendanceStatus;
                sessionDate: string;
                contextType: import("../../database/entities/attendance-session.entity").AttendanceContextType;
                contextId: string;
                organizationId: string;
                recordedAt: string;
            }[];
            id: string;
            name: string;
            gradeId: number | null | undefined;
            learnerProfile: "school" | "independent";
            independentType: "adult" | "gap_year" | "homeschool" | "other" | null | undefined;
            learningLevel: string;
            educationTypeId: string;
            trackId: string;
            grade: string;
            major: string;
            targetUniversity: string;
            targetField: string;
            targetRank: string;
            dailyCapacity: string;
            nationalCode: string | null;
            birthDate: string | null;
            governmentSchool: string | null;
            classId: string | null;
            className: string | null;
            accountStatus: "active" | "inactive" | "archived";
            registrationStatus: "APPROVED" | "REJECTED" | "ACCOUNT_CREATED" | "IN_PROGRESS" | "WAITING_REVIEW" | "NEEDS_CORRECTION" | "ACTIVE";
            profileComplete: boolean;
            organization: {
                id: string;
                name: string;
            } | null;
            phoneNumber: string | null;
            user: {
                id: string;
                username: string;
                phoneNumber: string | null;
                status: import("../../database/entities/user.entity").UserStatus;
            } | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    update(u: AuthenticatedUser, id: string, d: UpdateStudentDto): Promise<{
        ok: boolean;
        data: {
            id: string;
            name: string;
            gradeId: number | null | undefined;
            learnerProfile: "school" | "independent";
            independentType: "adult" | "gap_year" | "homeschool" | "other" | null | undefined;
            learningLevel: string;
            educationTypeId: string;
            trackId: string;
            grade: string;
            major: string;
            targetUniversity: string;
            targetField: string;
            targetRank: string;
            dailyCapacity: string;
            nationalCode: string | null;
            birthDate: string | null;
            governmentSchool: string | null;
            classId: string | null;
            className: string | null;
            accountStatus: "active" | "inactive" | "archived";
            registrationStatus: "APPROVED" | "REJECTED" | "ACCOUNT_CREATED" | "IN_PROGRESS" | "WAITING_REVIEW" | "NEEDS_CORRECTION" | "ACTIVE";
            profileComplete: boolean;
            organization: {
                id: string;
                name: string;
            } | null;
            phoneNumber: string | null;
            user: {
                id: string;
                username: string;
                phoneNumber: string | null;
                status: import("../../database/entities/user.entity").UserStatus;
            } | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    remove(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            archived: boolean;
        };
    }>;
    activate(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: import("../../database/entities").Student | {
            id: string;
            sessionsRevoked: boolean;
        } | null;
    }>;
    deactivate(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: import("../../database/entities").Student | {
            id: string;
            sessionsRevoked: boolean;
        } | null;
    }>;
    restore(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: import("../../database/entities").Student | {
            id: string;
            sessionsRevoked: boolean;
        } | null;
    }>;
    forceLogout(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: import("../../database/entities").Student | {
            id: string;
            sessionsRevoked: boolean;
        } | null;
    }>;
    reset(u: AuthenticatedUser, id: string, d: ResetStudentPasswordDto): Promise<{
        ok: boolean;
        data: {
            id: string;
            passwordReset: boolean;
            sessionsRevoked: boolean;
        };
    }>;
    learning(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            summary: {
                totalItems: number;
                pendingItems: number;
                dueItems: number;
                averageMastery: number;
                attempts: number;
                averageExamPercent: number;
                lastAttemptAt: null;
                subjects: {
                    subject: string;
                    items: number;
                    due: number;
                    mastery: number;
                }[];
                mistakePatterns: never[];
            };
            items: {
                student: undefined;
                studentId: string;
                id: string;
                subject: string;
                book: string;
                chapter: string;
                lesson: string;
                topic: string;
                title: string;
                note: string;
                hint: string;
                dueDate: string;
                intervalDays: number;
                reviewCount: number;
                mastery: number;
                status: import("../../database/entities/learning-item.entity").LearningStatus;
                completedAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
                reviews: import("../../database/entities").LearningReview[];
            }[];
        };
    }>;
    createLearning(u: AuthenticatedUser, id: string, d: CreateLearningItemDto): Promise<{
        ok: boolean;
        data: {
            student: undefined;
            studentId: string;
            id: string;
            subject: string;
            book: string;
            chapter: string;
            lesson: string;
            topic: string;
            title: string;
            note: string;
            hint: string;
            dueDate: string;
            intervalDays: number;
            reviewCount: number;
            mastery: number;
            status: import("../../database/entities/learning-item.entity").LearningStatus;
            completedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            reviews: import("../../database/entities").LearningReview[];
        };
    }>;
    updateLearning(u: AuthenticatedUser, id: string, itemId: string, d: UpdateLearningItemDto): Promise<{
        ok: boolean;
        data: {
            student: undefined;
            studentId: string;
            id: string;
            subject: string;
            book: string;
            chapter: string;
            lesson: string;
            topic: string;
            title: string;
            note: string;
            hint: string;
            dueDate: string;
            intervalDays: number;
            reviewCount: number;
            mastery: number;
            status: import("../../database/entities/learning-item.entity").LearningStatus;
            completedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            reviews: import("../../database/entities").LearningReview[];
        };
    }>;
    deleteLearning(u: AuthenticatedUser, id: string, itemId: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            deleted: boolean;
        };
    }>;
    reviewLearning(u: AuthenticatedUser, id: string, itemId: string, d: ReviewLearningItemDto): Promise<{
        ok: boolean;
        data: {
            item: {
                student: undefined;
                studentId: string;
                id: string;
                subject: string;
                book: string;
                chapter: string;
                lesson: string;
                topic: string;
                title: string;
                note: string;
                hint: string;
                dueDate: string;
                intervalDays: number;
                reviewCount: number;
                mastery: number;
                status: import("../../database/entities/learning-item.entity").LearningStatus;
                completedAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
                reviews: import("../../database/entities").LearningReview[];
            };
            review: import("../../database/entities").LearningReview;
        };
    }>;
    history(u: AuthenticatedUser, id: string, itemId: string): Promise<{
        ok: boolean;
        data: import("../../database/entities").LearningReview[];
    }>;
    weekly(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            percent: number;
            completed: number;
            total: number;
            studentId: string;
            from: string;
            to: string;
            days: {
                date: string;
                completed: number;
                total: number;
                percent: number;
            }[];
        };
    }>;
    topics(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: import("../../database/entities").TopicMastery[];
    }>;
    inbox(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            issues: {
                status: string;
                studentId: string;
                taskId: string;
                issueType: string;
                note: string;
                id: string;
                task: import("../../database/entities").Task;
                student: import("../../database/entities").Student;
                type: string;
                description: string;
                advisorNote: string;
                createdAt: Date;
            }[];
            recoveryRequests: import("../../database/entities").RecoveryRequest[];
            reviews: import("../../database/entities").LearningItem[];
            missedTasks: never[];
            examRetryRequests: {
                examTitle: string;
                id: string;
                exam: import("../../database/entities").Exam;
                student: import("../../database/entities").Student;
                message: string;
                status: import("../../database/entities/exam-retry-request.entity").RetryRequestStatus;
                moderatorNote: string;
                resolvedBy?: import("../../database/entities").User | null;
                resolvedAt?: Date | null;
                createdAt: Date;
                updatedAt: Date;
            }[];
        };
    }>;
    updateIssue(u: AuthenticatedUser, id: string, d: UpdateTaskIssueDto): Promise<{
        ok: boolean;
        data: import("../../database/entities").TaskIssue;
    }>;
}
