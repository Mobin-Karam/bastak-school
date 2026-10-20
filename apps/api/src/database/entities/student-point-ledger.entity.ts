import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { AttendanceRecord } from "./attendance-record.entity";
import { Organization } from "./organization.entity";
import { Student } from "./student.entity";
import { User } from "./user.entity";

/** Immutable explanation of a change to a student's school points. */
@Entity("student_point_ledger")
@Index("UQ_student_point_ledger_attendance_record", ["attendanceRecord"], {
  unique: true,
  where: "attendanceRecordId IS NOT NULL",
})
@Index("IDX_student_point_ledger_student_created", [
  "student",
  "createdAt",
  "id",
])
@Index(
  "UQ_student_point_ledger_request_scope",
  ["organization", "awardedBy", "requestId"],
  { unique: true, where: "requestId IS NOT NULL AND awardedById IS NOT NULL" },
)
export class StudentPointLedger {
  @PrimaryGeneratedColumn("uuid") id!: string;

  @ManyToOne(() => Student, { nullable: false, onDelete: "CASCADE" })
  student!: Student;

  @ManyToOne(() => Organization, { nullable: false, onDelete: "CASCADE" })
  organization!: Organization;

  /** Present/absent rows are reconciled to this single entry. */
  @ManyToOne(() => AttendanceRecord, { nullable: true, onDelete: "CASCADE" })
  attendanceRecord?: AttendanceRecord | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  awardedBy?: User | null;

  @Column({ type: "integer" }) points!: number;
  @Column({ type: "varchar", length: 32 }) source!:
    "attendance" | "teacher_adjustment";
  @Column({ type: "varchar", nullable: true }) requestId?: string | null;
  @Column({ type: "text" }) reason!: string;
  @CreateDateColumn() createdAt!: Date;
}
