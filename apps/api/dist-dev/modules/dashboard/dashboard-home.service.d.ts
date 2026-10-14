import { AuthenticatedUser } from "../auth";
import { LegacyDashboardService } from "./dashboard.service";
import { ScheduleService } from "../schedule";
import { SchoolHomeService } from "../school-home";
export declare class DashboardHomeService {
    private readonly legacy;
    private readonly schedule;
    private readonly schoolHome;
    constructor(legacy: LegacyDashboardService, schedule: ScheduleService, schoolHome: SchoolHomeService);
    get(user: AuthenticatedUser, requested?: string): Promise<{
        home: {
            calendar: {
                date: string;
                entries: {
                    id: string;
                    title: string;
                    weekday: number;
                    startTime: string;
                    endTime: string;
                    room: string;
                    className: string | null;
                    classId: string | null;
                }[];
                audience: string;
            };
            prayer: {
                organizationId: string;
                date: string;
                times: {
                    id: string;
                    date: string;
                    fajr: string;
                    sunrise: string;
                    dhuhr: string;
                    asr: string;
                    maghrib: string;
                    isha: string;
                    source: string;
                    updatedAt: Date;
                } | null;
            } | null;
            announcements: {
                id: string;
                organizationId: string;
                audience: import("../../database/entities/school-announcement.entity").SchoolAnnouncementAudience;
                classroomId: string | null;
                title: string;
                body: string;
                status: "ACTIVE" | "ARCHIVED" | "DRAFT";
                publishedAt: Date | null | undefined;
                expiresAt: Date | null | undefined;
                createdAt: Date;
            }[];
            currentClass: {
                id: string;
                title: string;
                weekday: number;
                startTime: string;
                endTime: string;
                room: string;
                className: string | null;
                classId: string | null;
            } | null;
        };
        attentionStudents: any;
        taskIssues: any;
        recoveryRequests: any;
        retryRequests: any;
        todayPlanHealth: any;
        upcomingExams: any;
        context: string;
        activeRole: string;
        generatedAt: string;
        assignedStudents: number;
        unreadConversations: any;
    } | {
        home: {
            calendar: {
                date: string;
                entries: {
                    id: string;
                    title: string;
                    weekday: number;
                    startTime: string;
                    endTime: string;
                    room: string;
                    className: string | null;
                    classId: string | null;
                }[];
                audience: string;
            };
            prayer: {
                organizationId: string;
                date: string;
                times: {
                    id: string;
                    date: string;
                    fajr: string;
                    sunrise: string;
                    dhuhr: string;
                    asr: string;
                    maghrib: string;
                    isha: string;
                    source: string;
                    updatedAt: Date;
                } | null;
            } | null;
            announcements: {
                id: string;
                organizationId: string;
                audience: import("../../database/entities/school-announcement.entity").SchoolAnnouncementAudience;
                classroomId: string | null;
                title: string;
                body: string;
                status: "ACTIVE" | "ARCHIVED" | "DRAFT";
                publishedAt: Date | null | undefined;
                expiresAt: Date | null | undefined;
                createdAt: Date;
            }[];
            currentClass: {
                id: string;
                title: string;
                weekday: number;
                startTime: string;
                endTime: string;
                room: string;
                className: string | null;
                classId: string | null;
            } | null;
        };
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
        assignedStudents: number;
        unreadConversations: any;
    } | {
        home: {
            calendar: {
                date: string;
                entries: {
                    id: string;
                    title: string;
                    weekday: number;
                    startTime: string;
                    endTime: string;
                    room: string;
                    className: string | null;
                    classId: string | null;
                }[];
                audience: string;
            };
            prayer: {
                organizationId: string;
                date: string;
                times: {
                    id: string;
                    date: string;
                    fajr: string;
                    sunrise: string;
                    dhuhr: string;
                    asr: string;
                    maghrib: string;
                    isha: string;
                    source: string;
                    updatedAt: Date;
                } | null;
            } | null;
            announcements: {
                id: string;
                organizationId: string;
                audience: import("../../database/entities/school-announcement.entity").SchoolAnnouncementAudience;
                classroomId: string | null;
                title: string;
                body: string;
                status: "ACTIVE" | "ARCHIVED" | "DRAFT";
                publishedAt: Date | null | undefined;
                expiresAt: Date | null | undefined;
                createdAt: Date;
            }[];
            currentClass: {
                id: string;
                title: string;
                weekday: number;
                startTime: string;
                endTime: string;
                room: string;
                className: string | null;
                classId: string | null;
            } | null;
        };
        recentProgress: any;
        upcomingGoals: any;
        messages: any;
        context: string;
        activeRole: string;
        generatedAt: string;
        assignedStudents: number;
        unreadConversations: any;
    } | {
        home: {
            calendar: {
                date: string;
                entries: {
                    id: string;
                    title: string;
                    weekday: number;
                    startTime: string;
                    endTime: string;
                    room: string;
                    className: string | null;
                    classId: string | null;
                }[];
                audience: string;
            };
            prayer: {
                organizationId: string;
                date: string;
                times: {
                    id: string;
                    date: string;
                    fajr: string;
                    sunrise: string;
                    dhuhr: string;
                    asr: string;
                    maghrib: string;
                    isha: string;
                    source: string;
                    updatedAt: Date;
                } | null;
            } | null;
            announcements: {
                id: string;
                organizationId: string;
                audience: import("../../database/entities/school-announcement.entity").SchoolAnnouncementAudience;
                classroomId: string | null;
                title: string;
                body: string;
                status: "ACTIVE" | "ARCHIVED" | "DRAFT";
                publishedAt: Date | null | undefined;
                expiresAt: Date | null | undefined;
                createdAt: Date;
            }[];
            currentClass: {
                id: string;
                title: string;
                weekday: number;
                startTime: string;
                endTime: string;
                room: string;
                className: string | null;
                classId: string | null;
            } | null;
        };
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
        assignedStudents: number;
        unreadConversations: any;
    } | {
        home: {
            calendar: {
                date: string;
                entries: {
                    id: string;
                    title: string;
                    weekday: number;
                    startTime: string;
                    endTime: string;
                    room: string;
                    className: string | null;
                    classId: string | null;
                }[];
                audience: string;
            };
            prayer: {
                organizationId: string;
                date: string;
                times: {
                    id: string;
                    date: string;
                    fajr: string;
                    sunrise: string;
                    dhuhr: string;
                    asr: string;
                    maghrib: string;
                    isha: string;
                    source: string;
                    updatedAt: Date;
                } | null;
            } | null;
            announcements: {
                id: string;
                organizationId: string;
                audience: import("../../database/entities/school-announcement.entity").SchoolAnnouncementAudience;
                classroomId: string | null;
                title: string;
                body: string;
                status: "ACTIVE" | "ARCHIVED" | "DRAFT";
                publishedAt: Date | null | undefined;
                expiresAt: Date | null | undefined;
                createdAt: Date;
            }[];
            currentClass: {
                id: string;
                title: string;
                weekday: number;
                startTime: string;
                endTime: string;
                room: string;
                className: string | null;
                classId: string | null;
            } | null;
        };
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
        assignedStudents: number;
        unreadConversations: any;
    } | {
        home: {
            calendar: {
                date: string;
                entries: {
                    id: string;
                    title: string;
                    weekday: number;
                    startTime: string;
                    endTime: string;
                    room: string;
                    className: string | null;
                    classId: string | null;
                }[];
                audience: string;
            };
            prayer: {
                organizationId: string;
                date: string;
                times: {
                    id: string;
                    date: string;
                    fajr: string;
                    sunrise: string;
                    dhuhr: string;
                    asr: string;
                    maghrib: string;
                    isha: string;
                    source: string;
                    updatedAt: Date;
                } | null;
            } | null;
            announcements: {
                id: string;
                organizationId: string;
                audience: import("../../database/entities/school-announcement.entity").SchoolAnnouncementAudience;
                classroomId: string | null;
                title: string;
                body: string;
                status: "ACTIVE" | "ARCHIVED" | "DRAFT";
                publishedAt: Date | null | undefined;
                expiresAt: Date | null | undefined;
                createdAt: Date;
            }[];
            currentClass: {
                id: string;
                title: string;
                weekday: number;
                startTime: string;
                endTime: string;
                room: string;
                className: string | null;
                classId: string | null;
            } | null;
        };
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
        platformOrganizations: any;
        context: string;
        activeRole: string;
        generatedAt: string;
        assignedStudents: number;
        unreadConversations: any;
    } | {
        home: {
            calendar: {
                date: string;
                entries: {
                    id: string;
                    title: string;
                    weekday: number;
                    startTime: string;
                    endTime: string;
                    room: string;
                    className: string | null;
                    classId: string | null;
                }[];
                audience: string;
            };
            prayer: {
                organizationId: string;
                date: string;
                times: {
                    id: string;
                    date: string;
                    fajr: string;
                    sunrise: string;
                    dhuhr: string;
                    asr: string;
                    maghrib: string;
                    isha: string;
                    source: string;
                    updatedAt: Date;
                } | null;
            } | null;
            announcements: {
                id: string;
                organizationId: string;
                audience: import("../../database/entities/school-announcement.entity").SchoolAnnouncementAudience;
                classroomId: string | null;
                title: string;
                body: string;
                status: "ACTIVE" | "ARCHIVED" | "DRAFT";
                publishedAt: Date | null | undefined;
                expiresAt: Date | null | undefined;
                createdAt: Date;
            }[];
            currentClass: {
                id: string;
                title: string;
                weekday: number;
                startTime: string;
                endTime: string;
                room: string;
                className: string | null;
                classId: string | null;
            } | null;
        };
        context: string;
        activeRole: string;
        generatedAt: string;
        assignedStudents: number;
        unreadConversations: any;
    } | {
        home: {
            calendar: {
                date: string;
                entries: {
                    id: string;
                    title: string;
                    weekday: number;
                    startTime: string;
                    endTime: string;
                    room: string;
                    className: string | null;
                    classId: string | null;
                }[];
                audience: string;
            };
            prayer: {
                organizationId: string;
                date: string;
                times: {
                    id: string;
                    date: string;
                    fajr: string;
                    sunrise: string;
                    dhuhr: string;
                    asr: string;
                    maghrib: string;
                    isha: string;
                    source: string;
                    updatedAt: Date;
                } | null;
            } | null;
            announcements: {
                id: string;
                organizationId: string;
                audience: import("../../database/entities/school-announcement.entity").SchoolAnnouncementAudience;
                classroomId: string | null;
                title: string;
                body: string;
                status: "ACTIVE" | "ARCHIVED" | "DRAFT";
                publishedAt: Date | null | undefined;
                expiresAt: Date | null | undefined;
                createdAt: Date;
            }[];
            currentClass: {
                id: string;
                title: string;
                weekday: number;
                startTime: string;
                endTime: string;
                room: string;
                className: string | null;
                classId: string | null;
            } | null;
        };
        children: number;
        context: string;
        activeRole: string;
        generatedAt: string;
        assignedStudents: number;
        unreadConversations: any;
    }>;
    attention(user: AuthenticatedUser, limit?: number): Promise<{
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
    }>;
    private calendarAudience;
}
