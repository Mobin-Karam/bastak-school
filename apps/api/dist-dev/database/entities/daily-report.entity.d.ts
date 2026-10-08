import { Student } from "./student.entity";
export declare class DailyReport {
    id: string;
    student: Student;
    planDate: string;
    studyHours: number;
    tests: number;
    correct: number;
    wrong: number;
    blank: number;
    focus: number;
    fatigue: number;
    motivation: number;
    problem: string;
    tomorrow: string;
    createdAt: Date;
    updatedAt: Date;
}
