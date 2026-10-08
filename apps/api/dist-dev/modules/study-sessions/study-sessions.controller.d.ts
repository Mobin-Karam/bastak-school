import { AuthenticatedUser } from "../auth";
import { FinishStudySessionDto } from "./dto/finish-study-session.dto";
import { StartStudySessionDto } from "./dto/start-study-session.dto";
import { StudySessionsService } from "./study-sessions.service";
export declare class StudySessionsController {
    private readonly studySessions;
    constructor(studySessions: StudySessionsService);
    start(user: AuthenticatedUser, dto: StartStudySessionDto): Promise<{
        ok: boolean;
        data: {
            id: string;
            taskId: string;
            status: import("../../database/entities/study-session.entity").StudySessionStatus;
            startedAt: Date;
            lastHeartbeatAt: Date | null | undefined;
            pausedAt: Date | null | undefined;
            finishedAt: Date | null | undefined;
            elapsedSeconds: number;
            actualTests: number;
            difficulty: string;
            note: string;
        };
    }>;
    active(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            id: string;
            taskId: string;
            status: import("../../database/entities/study-session.entity").StudySessionStatus;
            startedAt: Date;
            lastHeartbeatAt: Date | null | undefined;
            pausedAt: Date | null | undefined;
            finishedAt: Date | null | undefined;
            elapsedSeconds: number;
            actualTests: number;
            difficulty: string;
            note: string;
        } | null;
    }>;
    heartbeat(user: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            taskId: string;
            status: import("../../database/entities/study-session.entity").StudySessionStatus;
            startedAt: Date;
            lastHeartbeatAt: Date | null | undefined;
            pausedAt: Date | null | undefined;
            finishedAt: Date | null | undefined;
            elapsedSeconds: number;
            actualTests: number;
            difficulty: string;
            note: string;
        };
    }>;
    pause(user: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            taskId: string;
            status: import("../../database/entities/study-session.entity").StudySessionStatus;
            startedAt: Date;
            lastHeartbeatAt: Date | null | undefined;
            pausedAt: Date | null | undefined;
            finishedAt: Date | null | undefined;
            elapsedSeconds: number;
            actualTests: number;
            difficulty: string;
            note: string;
        };
    }>;
    resume(user: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            taskId: string;
            status: import("../../database/entities/study-session.entity").StudySessionStatus;
            startedAt: Date;
            lastHeartbeatAt: Date | null | undefined;
            pausedAt: Date | null | undefined;
            finishedAt: Date | null | undefined;
            elapsedSeconds: number;
            actualTests: number;
            difficulty: string;
            note: string;
        };
    }>;
    finish(user: AuthenticatedUser, id: string, dto: FinishStudySessionDto): Promise<{
        ok: boolean;
        data: {
            id: string;
            taskId: string;
            status: import("../../database/entities/study-session.entity").StudySessionStatus;
            startedAt: Date;
            lastHeartbeatAt: Date | null | undefined;
            pausedAt: Date | null | undefined;
            finishedAt: Date | null | undefined;
            elapsedSeconds: number;
            actualTests: number;
            difficulty: string;
            note: string;
        };
    }>;
}
