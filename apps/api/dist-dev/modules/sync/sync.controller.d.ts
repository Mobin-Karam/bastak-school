import { AuthenticatedUser } from "../auth";
import { UploadSyncDto } from "./dto/sync.dto";
import { SyncService } from "./sync.service";
export declare class SyncController {
    private readonly syncService;
    constructor(syncService: SyncService);
    sync(user: AuthenticatedUser, cursor?: string, lastSync?: string): Promise<{
        ok: boolean;
        data: {
            cursor: string;
            reset: boolean;
            serverTime: string;
            supported: {
                pull: string[];
                upload: string[];
            };
            unsupported: string[];
            plans: import("../../database/entities").Plan[];
            tasks: import("../../database/entities").Task[];
            studySessions: import("../../database/entities").StudySession[];
            exams: {
                id: string;
                title: string;
                subject: string;
                durationMinutes: number;
                openAt: Date | null | undefined;
                closeAt: Date | null | undefined;
                questionCount: number;
                updatedAt: Date;
            }[];
            examAttempts: import("../../database/entities").ExamAttempt[];
            notifications: import("../../database/entities").Notification[];
            learningItems: import("../../database/entities").LearningItem[] | never[];
            reviews: import("../../database/entities").LearningReview[] | never[];
        };
    }>;
    upload(user: AuthenticatedUser, dto: UploadSyncDto): Promise<{
        ok: boolean;
        data: {
            accepted: {
                id: string;
                result: unknown;
                replayed?: boolean;
            }[];
            rejected: {
                id?: string;
                code: string;
            }[];
            acceptedCount: number;
            rejectedCount: number;
            serverTime: string;
        };
    }>;
}
