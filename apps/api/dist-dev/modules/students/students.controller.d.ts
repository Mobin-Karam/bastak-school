import { AuthenticatedUser } from "../auth";
import { StudentsService } from "./students.service";
import { CreateLearningItemDto, ReviewLearningItemDto, UpdateLearningItemDto } from "./dto/learning.dto";
export declare class StudentController {
    private readonly students;
    constructor(students: StudentsService);
    dashboard(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            student: {
                id: string;
                name: string;
                grade: string;
                major: string;
                targetUniversity: string;
                targetField: string;
                targetRank: string;
                dailyCapacity: string;
            } | null;
            plan: import("../../database/entities").Plan | null;
            tasks: never[] | import("../../database/entities").Task[];
            metrics: {
                completed: number;
                total: number;
                percent: number;
            };
            healthScore: null;
            risk: string;
            todayStatus: string;
            recommendations: never[];
        };
    }>;
    today(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            student: null;
            plan: null;
            tasks: never[];
        } | {
            student: {
                id: string;
                name: string;
                grade: string;
                major: string;
                targetUniversity: string;
                targetField: string;
                targetRank: string;
                dailyCapacity: string;
            };
            plan: import("../../database/entities").Plan | null;
            tasks: import("../../database/entities").Task[];
        };
    }>;
    plans(user: AuthenticatedUser, date?: string): Promise<{
        ok: boolean;
        data: import("../../database/entities").Plan[];
    }>;
    progress(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            studentId: string | null;
            completed: number;
            total: number;
            percent: number;
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
    weeklyProgress(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            studentId: string | null;
            completed: number;
            total: number;
            percent: number;
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
    reviews(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            studentId: string | null;
            items: import("../../database/entities").Task[];
        };
    }>;
    learningSummary(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            total: number;
            averageScore: number;
        };
    }>;
    learningItems(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: import("../../database/entities").TopicMastery[];
    }>;
    chatPrivacy(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            guardianReadOnly: boolean;
        };
    }>;
    updateChatPrivacy(user: AuthenticatedUser, enabled: unknown): Promise<{
        ok: boolean;
        data: {
            guardianReadOnly: boolean;
        };
    }>;
}
export declare class StudentParityController {
    private readonly students;
    constructor(students: StudentsService);
    reviews(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            studentId: string | null;
            items: import("../../database/entities").Task[];
        };
    }>;
    weeklyProgress(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            studentId: string | null;
            completed: number;
            total: number;
            percent: number;
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
    learningSummary(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            total: number;
            averageScore: number;
        };
    }>;
    learningItems(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: import("../../database/entities").TopicMastery[];
    }>;
    createLearning(user: AuthenticatedUser, dto: CreateLearningItemDto): Promise<{
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
    updateLearning(user: AuthenticatedUser, id: string, dto: UpdateLearningItemDto): Promise<{
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
    deleteLearning(user: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            deleted: boolean;
        };
    }>;
    reviewLearning(user: AuthenticatedUser, id: string, dto: ReviewLearningItemDto): Promise<{
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
    learningHistory(user: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: import("../../database/entities").LearningReview[];
    }>;
}
export declare class StudentsController {
    private readonly students;
    constructor(students: StudentsService);
    me(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: import("../../database/entities").Student | null;
    }>;
    meProfile(user: AuthenticatedUser): Promise<{
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
            id?: string | undefined;
            user?: import("../../database/entities/user.entity").User | null;
            organization?: import("../../database/entities").Organization | null;
            name?: string | undefined;
            nationalCode?: string | null;
            gradeId?: number | null;
            learnerProfile?: "school" | "independent" | undefined;
            independentType?: "adult" | "gap_year" | "homeschool" | "other" | null;
            learningLevel?: string | undefined;
            educationTypeId?: string | undefined;
            trackId?: string | undefined;
            grade?: string | undefined;
            major?: string | undefined;
            targetUniversity?: string | undefined;
            targetField?: string | undefined;
            targetRank?: string | undefined;
            dailyCapacity?: string | undefined;
            accountStatus?: "active" | "inactive" | "archived" | undefined;
            onboardingStatus?: "PENDING_ASSIGNMENT" | "ASSIGNED" | undefined;
            registrationStatus?: "APPROVED" | "REJECTED" | "ACCOUNT_CREATED" | "IN_PROGRESS" | "WAITING_REVIEW" | "NEEDS_CORRECTION" | "ACTIVE" | undefined;
            guardianChatReadOnly?: boolean | undefined;
            guardianChangedAt?: Date | null;
            createdAt?: Date | undefined;
            updatedAt?: Date | undefined;
            plans?: import("../../database/entities").Plan[] | undefined;
            examAttempts?: import("../../database/entities").ExamAttempt[] | undefined;
            dailyReports?: import("../../database/entities").DailyReport[] | undefined;
            recoveryRequests?: import("../../database/entities").RecoveryRequest[] | undefined;
            learningItems?: import("../../database/entities").LearningItem[] | undefined;
            profile?: import("../../database/entities").StudentProfile | null;
            enrollments?: import("../../database/entities").EducationClassEnrollment[];
        };
    }>;
}
