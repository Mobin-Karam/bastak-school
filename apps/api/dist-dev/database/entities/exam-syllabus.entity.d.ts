import { Exam } from "./exam.entity";
export declare class ExamSyllabus {
    id: string;
    exam: Exam;
    subject: string;
    description: string;
    required: boolean;
    track: string;
}
