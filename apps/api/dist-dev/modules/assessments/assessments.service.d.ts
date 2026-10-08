import { DataSource, Repository } from "typeorm";
import { Exam } from "../../database/entities/exam.entity";
import { ExamAssignment } from "../../database/entities/exam-assignment.entity";
import { ExamClassAssignment } from "../../database/entities/exam-class-assignment.entity";
import { ExamAttempt } from "../../database/entities/exam-attempt.entity";
import { ExamRetryRequest } from "../../database/entities/exam-retry-request.entity";
import { ExamSyllabus } from "../../database/entities/exam-syllabus.entity";
import { Organization } from "../../database/entities/organization.entity";
import { Quiz } from "../../database/entities/quiz.entity";
import { QuizAttempt } from "../../database/entities/quiz-attempt.entity";
import { QuizAssignment } from "../../database/entities/quiz-assignment.entity";
import { QuizClassAssignment } from "../../database/entities/quiz-class-assignment.entity";
import { EducationClass } from "../../database/entities/education-class.entity";
import { EducationClassEnrollment } from "../../database/entities/education-class-enrollment.entity";
import { QuizQuestion } from "../../database/entities/quiz-question.entity";
import { Student } from "../../database/entities/student.entity";
import { SyllabusProgress } from "../../database/entities/syllabus-progress.entity";
import { RetryRequestStatus } from "../../database/entities/exam-retry-request.entity";
import { AuthorizationService, UserContext } from "../authorization";
import { CreateQuizDto, ModerateRetryDto, QuizAudienceRulesDto, QuizQuestionDto, SubmitQuizDto, SyllabusDto, SyllabusProgressDto, UpdateQuizDto } from "./dto/assessment.dto";
export declare class AssessmentsService {
    private exams;
    private assignments;
    private syllabus;
    private progress;
    private retries;
    private quizzes;
    private questions;
    private attempts;
    private quizAssignments;
    private quizClassAssignments;
    private classes;
    private classEnrollments;
    private students;
    private examAttempts;
    private authz;
    private db;
    private examClassAssignments?;
    constructor(exams: Repository<Exam>, assignments: Repository<ExamAssignment>, syllabus: Repository<ExamSyllabus>, progress: Repository<SyllabusProgress>, retries: Repository<ExamRetryRequest>, quizzes: Repository<Quiz>, questions: Repository<QuizQuestion>, attempts: Repository<QuizAttempt>, quizAssignments: Repository<QuizAssignment>, quizClassAssignments: Repository<QuizClassAssignment>, classes: Repository<EducationClass>, classEnrollments: Repository<EducationClassEnrollment>, students: Repository<Student>, examAttempts: Repository<ExamAttempt>, authz: AuthorizationService, db: DataSource, examClassAssignments?: Repository<ExamClassAssignment> | undefined);
    private student;
    addSyllabus(context: UserContext, examId: string, dto: SyllabusDto): Promise<ExamSyllabus>;
    removeSyllabus(context: UserContext, id: string): Promise<{
        id: string;
        deleted: boolean;
    }>;
    updateProgress(userId: string, id: string, dto: SyllabusProgressDto): Promise<SyllabusProgress>;
    studentSyllabus(userId: string, examId: string): Promise<{
        id: string;
        subject: string;
        description: string;
        required: boolean;
        track: string;
        progress: {
            status: import("../../database/entities/syllabus-progress.entity").SyllabusProgressStatus;
            accuracy: number;
            note: string;
            updatedAt: Date;
        } | null;
    }[]>;
    requestRetry(userId: string, examId: string, message?: string): Promise<ExamRetryRequest>;
    studentRetries(userId: string): Promise<{
        id: string;
        examId: string;
        examTitle: string;
        message: string;
        status: RetryRequestStatus;
        moderatorNote: string;
        resolvedAt: Date | null | undefined;
        createdAt: Date;
    }[]>;
    listRetries(context: UserContext): Promise<ExamRetryRequest[]>;
    moderateRetry(context: UserContext, userId: string, id: string, dto: ModerateRetryDto): Promise<ExamRetryRequest>;
    listQuizzes(context: UserContext): Promise<Quiz[]>;
    studentQuizzes(userId: string): Promise<{
        id: string;
        title: string;
        subject: string;
        durationMinutes: number;
        questionCount: number;
        examId: string | null;
        attemptLimit: number;
        attemptsUsed: number;
        openAt: Date | null | undefined;
        closeAt: Date | null | undefined;
        resultPolicy: "immediate" | "manual";
        attempt: {
            id: string;
            submittedAt: Date | null | undefined;
            percent: number;
        } | null;
    }[]>;
    createQuiz(context: UserContext, dto: CreateQuizDto): Promise<Quiz>;
    updateQuiz(context: UserContext, id: string, dto: UpdateQuizDto): Promise<Quiz>;
    listQuizAssignments(context: UserContext, id: string): Promise<{
        id: string;
        studentId: string;
        name: string;
        grade: string;
        gradeId: number | null | undefined;
        educationTypeId: string;
        trackId: string;
    }[]>;
    assignQuiz(context: UserContext, id: string, studentIds: string[]): Promise<{
        id: string;
        studentId: string;
        name: string;
        grade: string;
        gradeId: number | null | undefined;
        educationTypeId: string;
        trackId: string;
    }[]>;
    listQuizClassAssignments(context: UserContext, id: string): Promise<{
        id: string;
        classId: string;
        name: string;
        code: string;
        schoolYear: string;
        enrollmentCount: number;
    }[]>;
    assignQuizClasses(context: UserContext, id: string, classIds: string[]): Promise<{
        id: string;
        classId: string;
        name: string;
        code: string;
        schoolYear: string;
        enrollmentCount: number;
    }[]>;
    setQuizAudienceRules(context: UserContext, id: string, dto: QuizAudienceRulesDto): Promise<{
        gradeIds: number[];
        educationTypeIds: string[];
        trackIds: string[];
        learnerProfiles: string[];
        independentTypes: string[];
    }>;
    releaseQuizResults(context: UserContext, id: string): Promise<{
        id: string;
        resultsReleasedAt: Date;
    }>;
    removeQuiz(context: UserContext, id: string): Promise<{
        id: string;
        archived: boolean;
        reason: string;
        deleted?: undefined;
    } | {
        id: string;
        deleted: boolean;
        archived?: undefined;
        reason?: undefined;
    }>;
    quizQuestions(context: UserContext, id: string, answers?: boolean): Promise<{
        id: string;
        quiz: Quiz;
        text: string;
        options: string[];
        sortOrder: number;
        questionBankItemId?: string | null;
    }[]>;
    quizAnalytics(context: UserContext, id: string): Promise<{
        quiz: {
            id: string;
            title: string;
        };
        attempts: number;
        averagePercent: number | null;
        questions: {
            id: string;
            text: string;
            sortOrder: number;
            attempts: number;
            correct: number;
            accuracy: number | null;
            responses: {
                [key: string]: number;
            };
        }[];
        byGrade: {
            grade: string;
            attempts: number;
            averagePercent: number;
        }[];
    }>;
    addQuizQuestion(context: UserContext, id: string, dto: QuizQuestionDto): Promise<QuizQuestion>;
    updateQuizQuestion(context: UserContext, id: string, dto: QuizQuestionDto): Promise<QuizQuestion>;
    removeQuizQuestion(context: UserContext, id: string): Promise<{
        id: string;
        deleted: boolean;
    }>;
    studentQuiz(userId: string, id: string): Promise<{
        questions: {
            id: string;
            quiz: Quiz;
            text: string;
            options: string[];
            sortOrder: number;
            questionBankItemId?: string | null;
        }[];
        id: string;
        title: string;
        subject: string;
        durationMinutes: number;
        active: boolean;
        attemptLimit: number;
        openAt?: Date | null;
        closeAt?: Date | null;
        resultPolicy: "immediate" | "manual";
        resultsReleasedAt?: Date | null;
        audienceRules: {
            gradeIds: number[];
            educationTypeIds: string[];
            trackIds: string[];
            learnerProfiles: string[];
            independentTypes: string[];
        };
        exam?: Exam | null;
        organization?: Organization | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    startQuiz(userId: string, id: string): Promise<{
        runId: string;
        startedAt: Date;
        deadline: Date;
        remainingSeconds: number;
        savedAnswers: {
            questionId: string;
            selectedOption?: string | null;
        }[];
        quiz: {
            id: string;
            title: string;
            durationMinutes: number;
            questions: {
                id: string;
                quiz: Quiz;
                text: string;
                options: string[];
                sortOrder: number;
                questionBankItemId?: string | null;
            }[];
        };
    }>;
    submitQuiz(userId: string, id: string, dto: SubmitQuizDto): Promise<Record<string, unknown>>;
    history(userId: string, id?: string): Promise<Record<string, unknown> | (QuizAttempt | {
        id: string;
        quizId: string;
        startedAt: Date;
        submittedAt: Date | null | undefined;
        resultPending: boolean;
    })[]>;
    private canStudentAccessQuiz;
    private assertQuizAccess;
    private canStudentAccessExamAudience;
    private deliveryFields;
    private assertDeliveryWindow;
    private quizIsOpen;
    private requireQuizOpen;
    private audienceRules;
    private hasAudienceRules;
    private matchesAudienceRules;
    private requireOrganization;
    private requireExam;
    private requireQuiz;
    private runPayload;
    private result;
    private studentResult;
    private answerKey;
    private correctAnswerValue;
}
