import { Repository } from "typeorm";
import { ExamAttempt } from "../../database/entities/exam-attempt.entity";
import { Notification } from "../../database/entities/notification.entity";
import { Plan } from "../../database/entities/plan.entity";
import { Student } from "../../database/entities/student.entity";
import { StudySession } from "../../database/entities/study-session.entity";
import { SyncMutation } from "../../database/entities/sync-mutation.entity";
import { AuthenticatedUser } from "../auth";
import { TasksService } from "../tasks";
import { StudySessionsService } from "../study-sessions";
import { SyncChangeDto } from "./dto/sync.dto";
import { Exam } from "../../database/entities/exam.entity";
import { ExamAssignment } from "../../database/entities/exam-assignment.entity";
import { LearningItem } from "../../database/entities/learning-item.entity";
import { LearningReview } from "../../database/entities/learning-review.entity";
import { Task } from "../../database/entities/task.entity";
import { ReportsService } from "../reports";
import { StudentsService } from "../students";
import { ExamsService } from "../exams";
export declare class SyncService {
    private readonly students;
    private readonly plans;
    private readonly sessions;
    private readonly attempts;
    private readonly notifications;
    private readonly mutations;
    private readonly tasks;
    private readonly studySessions;
    private readonly taskRepo?;
    private readonly exams?;
    private readonly assignments?;
    private readonly learning?;
    private readonly reviews?;
    private readonly reports?;
    private readonly studentsService?;
    private readonly examsService?;
    constructor(students: Repository<Student>, plans: Repository<Plan>, sessions: Repository<StudySession>, attempts: Repository<ExamAttempt>, notifications: Repository<Notification>, mutations: Repository<SyncMutation>, tasks: TasksService, studySessions: StudySessionsService, taskRepo?: Repository<Task> | undefined, exams?: Repository<Exam> | undefined, assignments?: Repository<ExamAssignment> | undefined, learning?: Repository<LearningItem> | undefined, reviews?: Repository<LearningReview> | undefined, reports?: ReportsService | undefined, studentsService?: StudentsService | undefined, examsService?: ExamsService | undefined);
    pull(user: AuthenticatedUser, lastSync?: string): Promise<{
        cursor: string;
        reset: boolean;
        serverTime: string;
        supported: {
            pull: string[];
            upload: string[];
        };
        unsupported: string[];
        plans: Plan[];
        tasks: Task[];
        studySessions: StudySession[];
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
        examAttempts: ExamAttempt[];
        notifications: Notification[];
        learningItems: never[] | LearningItem[];
        reviews: never[] | LearningReview[];
    }>;
    upload(user: AuthenticatedUser, changes: SyncChangeDto[]): Promise<{
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
    }>;
    private apply;
    private requireObject;
    private validatedBody;
    private parseSince;
    private cursor;
    private notFound;
}
