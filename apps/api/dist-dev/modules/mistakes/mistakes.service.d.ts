import { Repository } from "typeorm";
import { Mistake } from "../../database/entities/mistake.entity";
import { Student } from "../../database/entities/student.entity";
import { AuthorizationService, UserContext } from "../authorization";
export declare class MistakesService {
    private readonly mistakes;
    private readonly students;
    private readonly authorization?;
    constructor(mistakes: Repository<Mistake>, students: Repository<Student>, authorization?: AuthorizationService | undefined);
    list(userId: string, limit?: string): Promise<Mistake[]>;
    listForStaff(context: UserContext, studentId: string, limit?: string): Promise<Mistake[]>;
    detail(userId: string, id: string): Promise<Mistake>;
    update(userId: string, id: string, body: {
        reason?: string;
        resolved?: boolean;
    }): Promise<Mistake>;
    updateByQuestion(userId: string, questionId: string, body: {
        reason?: string;
        resolved?: boolean;
    }): Promise<Mistake>;
    private studentForUser;
}
