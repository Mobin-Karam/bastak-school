import { AuthenticatedUser } from "../auth";
import { CompleteTaskDto } from "./dto/complete-task.dto";
import { CreateTaskCommentDto } from "./dto/create-task-comment.dto";
import { CreateTaskIssueDto } from "./dto/create-task-issue.dto";
import { TasksService } from "./tasks.service";
export declare class TasksController {
    private readonly tasks;
    constructor(tasks: TasksService);
    detail(user: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            task: import("../../database/entities").Task;
            comments: import("../../database/entities").TaskComment[];
            issues: import("../../database/entities").TaskIssue[];
        };
    }>;
    complete(user: AuthenticatedUser, id: string, dto: CompleteTaskDto): Promise<{
        ok: boolean;
        data: {
            id: string;
            status: string;
            completedAt: Date;
            actualMinutes: number;
            actualTests: number;
            difficulty: string;
            note: string;
        };
    }>;
    comment(user: AuthenticatedUser, id: string, dto: CreateTaskCommentDto): Promise<{
        ok: boolean;
        data: import("../../database/entities").TaskComment;
    }>;
    issue(user: AuthenticatedUser, id: string, dto: CreateTaskIssueDto): Promise<{
        ok: boolean;
        data: import("../../database/entities").TaskIssue;
    }>;
}
