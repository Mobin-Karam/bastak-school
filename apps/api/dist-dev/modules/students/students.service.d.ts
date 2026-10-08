import { DataSource, Repository } from "typeorm";
import { Student } from "../../database/entities/student.entity";
import { Task } from "../../database/entities/task.entity";
import { TopicMastery } from "../../database/entities/topic-mastery.entity";
import { User } from "../../database/entities/user.entity";
import { LearningItem, LearningStatus } from "../../database/entities/learning-item.entity";
import { LearningReview } from "../../database/entities/learning-review.entity";
import { Session } from "../../database/entities/session.entity";
export declare class StudentsService {
    private readonly students;
    private readonly users;
    private readonly mastery;
    private readonly learningItems;
    private readonly learningReviews;
    private readonly sessions;
    private readonly dataSource?;
    constructor(students: Repository<Student>, users: Repository<User>, mastery: Repository<TopicMastery>, learningItems: Repository<LearningItem>, learningReviews: Repository<LearningReview>, sessions: Repository<Session>, dataSource?: DataSource | undefined);
    list(): Promise<Student[]>;
    create(dto: {
        name?: string;
        username?: string;
        password?: string;
        grade?: string;
        major?: string;
        targetUniversity?: string;
        targetField?: string;
        targetRank?: string;
        dailyCapacity?: string;
    }): Promise<Student | null>;
    find(id: string): Promise<Student | null>;
    chatPrivacy(userId: string): Promise<{
        guardianReadOnly: boolean;
    }>;
    updateChatPrivacy(userId: string, enabled: unknown): Promise<{
        guardianReadOnly: boolean;
    }>;
    findStudent(id: string): Promise<Student | null>;
    update(id: string, dto: Partial<Student> & {
        username?: string;
        password?: string;
    }): Promise<Student | null>;
    remove(id: string): Promise<{
        id: string;
        archived: boolean;
    }>;
    lifecycle(id: string, action: "activate" | "deactivate" | "restore" | "force-logout"): Promise<Student | {
        id: string;
        sessionsRevoked: boolean;
    } | null>;
    resetPassword(id: string, password: string): Promise<{
        id: string;
        passwordReset: boolean;
        sessionsRevoked: boolean;
    }>;
    weeklyForStudent(id: string): Promise<{
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
    }>;
    topicsForStudent(id: string, limit?: number): Promise<TopicMastery[]>;
    learningForStudent(id: string): Promise<{
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
            status: LearningStatus;
            completedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            reviews: LearningReview[];
        }[];
    }>;
    createLearningItem(id: string, body: Partial<LearningItem>): Promise<{
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
        status: LearningStatus;
        completedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        reviews: LearningReview[];
    }>;
    updateLearningItem(studentId: string, itemId: string, body: Partial<LearningItem>): Promise<{
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
        status: LearningStatus;
        completedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        reviews: LearningReview[];
    }>;
    deleteLearningItem(studentId: string, itemId: string): Promise<{
        id: string;
        deleted: boolean;
    }>;
    learningReviewHistory(studentId: string, itemId: string, limit?: number): Promise<LearningReview[]>;
    studentIdForUser(userId: string): Promise<string>;
    reviewLearningItem(studentId: string, itemId: string, rating: number): Promise<{
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
            status: LearningStatus;
            completedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            reviews: LearningReview[];
        };
        review: LearningReview;
    }>;
    dashboard(userId?: string): Promise<{
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
        plan: import("../../database/entities/plan.entity").Plan | null;
        tasks: Task[] | never[];
        metrics: {
            completed: number;
            total: number;
            percent: number;
        };
        healthScore: null;
        risk: string;
        todayStatus: string;
        recommendations: never[];
    }>;
    today(userId?: string): Promise<{
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
        plan: import("../../database/entities/plan.entity").Plan | null;
        tasks: Task[];
    }>;
    day(userId?: string, isoDate?: string): Promise<{
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
        plan: import("../../database/entities/plan.entity").Plan | null;
        tasks: Task[];
    }>;
    progress(userId?: string): Promise<{
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
    }>;
    reviews(userId?: string): Promise<{
        studentId: string | null;
        items: Task[];
    }>;
    learning(userId?: string): Promise<{
        studentId: string | null;
        summary: {
            total: number;
            averageScore: number;
        };
        items: TopicMastery[];
    }>;
    dashboardForStudent(studentId: string): Promise<{
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
        todayPlan: import("../../database/entities/plan.entity").Plan | null;
        plan: import("../../database/entities/plan.entity").Plan | null;
        tasks: Task[];
        progress: {
            completed: number;
            total: number;
            percent: number;
        };
        metrics: {
            completed: number;
            total: number;
            percent: number;
        };
        healthScore: null;
        risk: string;
        todayStatus: string;
        recommendations: never[];
        alerts: never[];
    }>;
    private findByUserId;
    private publicStudent;
    private sortTasks;
    private taskMetrics;
    private addDays;
    private requireStudent;
    private progressForStudent;
    private learningInput;
    private publicLearningItem;
    private learningSummary;
}
