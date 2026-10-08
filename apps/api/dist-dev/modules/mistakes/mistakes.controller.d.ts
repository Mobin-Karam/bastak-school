import { AuthenticatedUser } from "../auth";
import { MistakesService } from "./mistakes.service";
export declare class MistakesController {
    private readonly mistakes;
    constructor(mistakes: MistakesService);
    list(user: AuthenticatedUser, limit?: string): Promise<{
        ok: boolean;
        data: import("../../database/entities").Mistake[];
    }>;
    detail(user: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: import("../../database/entities").Mistake;
    }>;
    classifyQuestion(user: AuthenticatedUser, questionId: string, body: {
        reason?: string;
        resolved?: boolean;
    }): Promise<{
        ok: boolean;
        data: import("../../database/entities").Mistake;
    }>;
    update(user: AuthenticatedUser, id: string, body: {
        reason?: string;
        resolved?: boolean;
    }): Promise<{
        ok: boolean;
        data: import("../../database/entities").Mistake;
    }>;
}
export declare class StaffMistakesController {
    private readonly mistakes;
    constructor(mistakes: MistakesService);
    private context;
    list(user: AuthenticatedUser, studentId: string, limit?: string): Promise<{
        ok: boolean;
        data: import("../../database/entities").Mistake[];
    }>;
}
