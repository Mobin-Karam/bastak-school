import { RecommendationStatus } from "../../database/entities/recommendation.entity";
import { AuthenticatedUser } from "../auth";
import { AnalyticsService } from "./analytics.service";
export declare class AnalyticsController {
    private analytics;
    constructor(analytics: AnalyticsService);
    private c;
    self(u: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            studentId: string;
            planCompletion: number | null;
            taskCompletion: number | null;
            studyDurationMinutes: number | null;
            studySessions: any;
            examPerformance: number | null;
            examAttempts: any;
            questionAccuracy: number | null;
            quizAttempts: any;
            reviewConsistency: any;
            averageMastery: number | null;
            subjectPerformance: any;
        } | {
            studentId: string;
            planCompletion: number | null;
            studyDurationMinutes: number | null;
            examPerformance: number | null;
            encouragement: string;
        };
    }>;
    student(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            studentId: string;
            planCompletion: number | null;
            taskCompletion: number | null;
            studyDurationMinutes: number | null;
            studySessions: any;
            examPerformance: number | null;
            examAttempts: any;
            questionAccuracy: number | null;
            quizAttempts: any;
            reviewConsistency: any;
            averageMastery: number | null;
            subjectPerformance: any;
        } | {
            studentId: string;
            planCompletion: number | null;
            studyDurationMinutes: number | null;
            examPerformance: number | null;
            encouragement: string;
        };
    }>;
    list(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            student: import("../../database/entities").Student;
            createdByType: string;
            createdByUser?: import("../../database/entities/user.entity").User | null;
            type: string;
            title: string;
            status: RecommendationStatus;
            createdAt: Date;
            actedAt?: Date | null;
        }[];
    }>;
    create(u: AuthenticatedUser, id: string, b: {
        type: string;
        title: string;
        reason: string;
        evidence: Record<string, unknown>;
    }): Promise<{
        ok: boolean;
        data: import("../../database/entities/recommendation.entity").Recommendation;
    }>;
    mine(u: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            id: string;
            type: string;
            title: string;
            status: RecommendationStatus;
            createdAt: Date;
        }[];
    }>;
    act(u: AuthenticatedUser, id: string, status: RecommendationStatus): Promise<{
        ok: boolean;
        data: import("../../database/entities/recommendation.entity").Recommendation;
    }>;
}
