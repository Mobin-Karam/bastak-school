import { DataSource, Repository } from "typeorm";
import { Recommendation } from "../../database/entities/recommendation.entity";
import { Student } from "../../database/entities/student.entity";
import { User } from "../../database/entities/user.entity";
import { RecommendationStatus } from "../../database/entities/recommendation.entity";
import { AuthorizationService, UserContext } from "../authorization";
export declare class AnalyticsService {
    private db;
    private students;
    private recommendations;
    private users;
    private authorization;
    constructor(db: DataSource, students: Repository<Student>, recommendations: Repository<Recommendation>, users: Repository<User>, authorization: AuthorizationService);
    analytics(context: UserContext, studentId: string, projection?: string): Promise<{
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
    }>;
    self(userId: string): Promise<{
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
    }>;
    metrics(studentId: string, projection: string): Promise<{
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
    }>;
    listRecommendations(context: UserContext, studentId: string, includeEvidence?: boolean): Promise<{
        id: string;
        student: Student;
        createdByType: string;
        createdByUser?: User | null;
        type: string;
        title: string;
        status: RecommendationStatus;
        createdAt: Date;
        actedAt?: Date | null;
    }[]>;
    selfRecommendations(userId: string): Promise<{
        id: string;
        type: string;
        title: string;
        status: RecommendationStatus;
        createdAt: Date;
    }[]>;
    createRecommendation(context: UserContext, userId: string, studentId: string, input: {
        type: string;
        title: string;
        reason: string;
        evidence: Record<string, unknown>;
    }): Promise<Recommendation>;
    act(userId: string, id: string, status: RecommendationStatus): Promise<Recommendation>;
    studentHealth(studentId: string): Promise<{
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
    }>;
}
