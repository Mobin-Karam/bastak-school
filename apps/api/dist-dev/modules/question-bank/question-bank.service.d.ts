import { Repository } from "typeorm";
import { QuestionBankItem } from "../../database/entities/question-bank-item.entity";
import { Exam } from "../../database/entities/exam.entity";
import { Question } from "../../database/entities/question.entity";
import { Quiz } from "../../database/entities/quiz.entity";
import { QuizQuestion } from "../../database/entities/quiz-question.entity";
import { AuthorizationService, UserContext } from "../authorization";
import { GenerateExamFromBankDto } from "./question-bank.dto";
export declare class QuestionBankService {
    private readonly items;
    private readonly exams;
    private readonly questions;
    private readonly quizzes;
    private readonly quizQuestions;
    private readonly authz;
    constructor(items: Repository<QuestionBankItem>, exams: Repository<Exam>, questions: Repository<Question>, quizzes: Repository<Quiz>, quizQuestions: Repository<QuizQuestion>, authz: AuthorizationService);
    list(c: UserContext, organizationId?: string, bankType?: "exam" | "quiz"): Promise<QuestionBankItem[]>;
    template(c: UserContext, bankType?: "exam" | "quiz"): Promise<{
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
    }>;
    export(c: UserContext, organizationId?: string, bankType?: "exam" | "quiz"): Promise<{
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
    }>;
    import(c: UserContext, body: {
        bankType?: "exam" | "quiz";
        questions?: Record<string, unknown>[];
    }): Promise<{
        created: number;
    }>;
    save(c: UserContext, body: Record<string, unknown>, id?: string): Promise<QuestionBankItem>;
    archive(c: UserContext, id: string): Promise<{
        id: string;
        archived: boolean;
    }>;
    copyToExam(c: UserContext, id: string, examId: string): Promise<Question>;
    generateExam(c: UserContext, dto: GenerateExamFromBankDto): Promise<{
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
        questions: Question[];
        requested?: undefined;
        selected?: undefined;
    }>;
    copyToQuiz(c: UserContext, id: string, quizId: string): Promise<QuizQuestion>;
    copyExamItemsToQuizBank(c: UserContext, itemIds: string[]): Promise<{
        created: number;
        skipped: number;
        items: QuestionBankItem[];
    }>;
    private allowed;
    private assertBankType;
    private normalizeDraft;
    private transferQuestion;
    private sampleQuestion;
    private requestedCounts;
    private pickBalanced;
}
