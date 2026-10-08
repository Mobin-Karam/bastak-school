import { AttendanceSession } from "./attendance-session.entity";
import { Student } from "./student.entity";
import { User } from "./user.entity";
export declare enum AttendanceStatus {
    PRESENT = "present",
    ABSENT = "absent",
    LATE = "late",
    EXCUSED = "excused"
}
export declare class AttendanceRecord {
    id: string;
    session: AttendanceSession;
    student: Student;
    status: AttendanceStatus;
    note: string;
    recordedBy?: User | null;
    createdAt: Date;
    updatedAt: Date;
}
