import { Repository } from "typeorm";
import { Student } from "../../database/entities/student.entity";
import { Task } from "../../database/entities/task.entity";
import { TaskComment } from "../../database/entities/task-comment.entity";
import { TaskIssue } from "../../database/entities/task-issue.entity";
import { CompleteTaskDto } from "./dto/complete-task.dto";
import { CreateTaskCommentDto } from "./dto/create-task-comment.dto";
import { CreateTaskIssueDto } from "./dto/create-task-issue.dto";
export declare class TasksService {
    private readonly tasks;
    private readonly students;
    private readonly comments;
    private readonly issues;
    constructor(tasks: Repository<Task>, students: Repository<Student>, comments: Repository<TaskComment>, issues: Repository<TaskIssue>);
    detail(userId: string, taskId: string): Promise<{
        task: Task;
        comments: TaskComment[];
        issues: TaskIssue[];
    }>;
    complete(userId: string, taskId: string, dto?: CompleteTaskDto): Promise<{
        id: string;
        status: string;
        completedAt: Date;
        actualMinutes: number;
        actualTests: number;
        difficulty: string;
        note: string;
    }>;
    addComment(userId: string, taskId: string, dto: CreateTaskCommentDto): Promise<TaskComment>;
    reportIssue(userId: string, taskId: string, dto: CreateTaskIssueDto): Promise<TaskIssue>;
    private ownedTask;
    private taskAndStudent;
}
