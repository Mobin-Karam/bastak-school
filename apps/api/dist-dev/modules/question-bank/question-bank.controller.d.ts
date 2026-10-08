import { AuthenticatedUser } from "../auth";
import { QuestionBankService } from "./question-bank.service";
import { GenerateExamFromBankDto } from "./question-bank.dto";
export declare class QuestionBankController {
    private readonly service;
    constructor(service: QuestionBankService);
    private c;
    list(u: AuthenticatedUser, org?: string, bankType?: "exam" | "quiz"): Promise<{
        ok: boolean;
        data: import("../../database/entities").QuestionBankItem[];
    }>;
    template(u: AuthenticatedUser, bankType?: "exam" | "quiz"): Promise<{
        ok: boolean;
        data: {
            schemaVersion: string;
            bankType: "exam" | "quiz";
            questions: {
                organizationId: string;
                text: string;
                options: string[];
                correctAnswer: string;
                explanation: string;
                subject: string;
                topic: string;
                book: string;
                grade: string;
                chapter: string;
                lesson: string;
                difficulty: string;
                source: string;
                tags: string[];
            }[];
        };
    }>;
    export(u: AuthenticatedUser, org?: string, bankType?: "exam" | "quiz"): Promise<{
        ok: boolean;
        data: {
            schemaVersion: string;
            bankType: "exam" | "quiz";
            questions: {
                organizationId: string;
                text: string;
                options: string[];
                correctAnswer: string;
                explanation: string;
                subject: string;
                topic: string;
                book: string;
                grade: string;
                chapter: string;
                lesson: string;
                difficulty: string;
                source: string;
                tags: string[];
            }[];
        };
    }>;
    import(u: AuthenticatedUser, body: {
        bankType?: "exam" | "quiz";
        questions?: Record<string, unknown>[];
    }): Promise<{
        ok: boolean;
        data: {
            created: number;
        };
    }>;
    create(u: AuthenticatedUser, b: Record<string, unknown>): Promise<{
        ok: boolean;
        data: import("../../database/entities").QuestionBankItem;
    }>;
    update(u: AuthenticatedUser, id: string, b: Record<string, unknown>): Promise<{
        ok: boolean;
        data: import("../../database/entities").QuestionBankItem;
    }>;
    archive(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            archived: boolean;
        };
    }>;
    addToExam(u: AuthenticatedUser, id: string, body: {
        examId?: string;
    }): Promise<{
        ok: boolean;
        data: import("../../database/entities").Question;
    }>;
    copyExamItemsToQuizBank(u: AuthenticatedUser, body: {
        itemIds?: string[];
    }): Promise<{
        ok: boolean;
        data: {
            created: number;
            skipped: number;
            items: import("../../database/entities").QuestionBankItem[];
        };
    }>;
    generateExam(u: AuthenticatedUser, body: GenerateExamFromBankDto): Promise<{
        ok: boolean;
        data: {
            preview: boolean;
            requested: {
                easy: number;
                medium: number;
                hard: number;
            };
            selected: {
                id: string;
                text: string;
                difficulty: string;
                subject: string;
                topic: string;
            }[];
            created?: undefined;
            skipped?: undefined;
            questions?: undefined;
        } | {
            preview: boolean;
            created: number;
            skipped: number;
            questions: import("../../database/entities").Question[];
            requested?: undefined;
            selected?: undefined;
        };
    }>;
    addToQuiz(u: AuthenticatedUser, id: string, body: {
        quizId?: string;
    }): Promise<{
        ok: boolean;
        data: import("../../database/entities").QuizQuestion;
    }>;
}
