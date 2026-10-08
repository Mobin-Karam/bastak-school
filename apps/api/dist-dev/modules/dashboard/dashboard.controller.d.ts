import { AuthenticatedUser } from "../auth";
import { LegacyDashboardService } from "./dashboard.service";
export declare class LegacyDashboardController {
    private dashboard;
    constructor(dashboard: LegacyDashboardService);
    get(user: AuthenticatedUser, context?: string): Promise<{
        ok: boolean;
        data: {
            attentionStudents: any;
            taskIssues: any;
            recoveryRequests: any;
            retryRequests: any;
            todayPlanHealth: any;
            upcomingExams: any;
            context: string;
            activeRole: string;
            generatedAt: string;
            assignedStudents: any;
            unreadConversations: any;
        } | {
            subjects: any;
            upcomingExams: any;
            recentExamResults: any;
            studentsNeedingAttention: any;
            contentTasks: {
                questions: any;
                quizzes: any;
            };
            context: string;
            activeRole: string;
            generatedAt: string;
            assignedStudents: any;
            unreadConversations: any;
        } | {
            recentProgress: any;
            upcomingGoals: any;
            messages: any;
            context: string;
            activeRole: string;
            generatedAt: string;
            assignedStudents: any;
            unreadConversations: any;
        } | {
            subjects: any;
            questions: any;
            quizzes: any;
            exams: any;
            draftCount: any;
            publishedCount: any;
            contentIssues: never[];
            context: string;
            activeRole: string;
            generatedAt: string;
            assignedStudents: any;
            unreadConversations: any;
        } | {
            organizations: string[];
            members: any;
            students: any;
            staff: any;
            activeUsers: any;
            inactiveUsers: any;
            analytics: {
                plans: any;
            };
            todayPlanHealth: {
                plans: number;
                tasks: number;
                completed: number;
            };
            weeklyPlanHealth: {
                plans: number;
                tasks: number;
                completed: number;
            };
            studentHealthSummary: {
                noPlan: number;
                noReport: number;
                syncFailed: number;
                openIssues: number;
                noAdvisor: number;
            };
            studentHealth: any;
            advisorCoverage: any;
            notices: never[];
            context: string;
            activeRole: string;
            generatedAt: string;
            assignedStudents: any;
            unreadConversations: any;
        } | {
            organizations: any;
            users: any;
            signupOverview: {
                enabledOrganizations: any;
                remainingCapacity: any;
                pendingAssignments: any;
            };
            systemHealth: {
                database: string;
                sqlite: boolean;
            };
            releaseStatus: {
                version: string;
                environment: string;
            };
            auditSummary: {
                events24h: any;
                lockedLogins: any;
            };
            context: string;
            activeRole: string;
            generatedAt: string;
            assignedStudents: any;
            unreadConversations: any;
        } | {
            context: string;
            activeRole: string;
            generatedAt: string;
            assignedStudents: any;
            unreadConversations: any;
        } | {
            children: any;
            context: string;
            activeRole: string;
            generatedAt: string;
            assignedStudents: any;
            unreadConversations: any;
        };
    }>;
    attention(user: AuthenticatedUser, limit?: string): Promise<{
        ok: boolean;
        data: {
            generatedAt: string;
            items: {
                id: string;
                type: "recovery" | "task_issue" | "retry_request" | "unread_chat" | "sync_failure" | "inactive_user";
                title: string;
                description: string;
                descriptionKind: "system" | "user";
                priority: "urgent" | "high" | "normal";
                owner: {
                    id: string;
                    label: string;
                };
                dueAt: string | null;
                status: "open";
                student?: {
                    id: string;
                    name: string;
                } | undefined;
                deepLink: string;
                createdAt: string | null;
                meta?: Record<string, string>;
            }[];
        };
    }>;
}
