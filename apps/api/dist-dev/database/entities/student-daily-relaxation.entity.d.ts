import { Student } from "./student.entity";
import { RelaxationTrack } from "./relaxation-track.entity";
export declare class StudentDailyRelaxation {
    id: string;
    student: Student;
    track: RelaxationTrack;
    date: string;
    selectedBy: "AUTO" | "STUDENT";
    createdAt: Date;
    updatedAt: Date;
}
