import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Organization } from "./organization.entity";
import { AttendanceSession } from "./attendance-session.entity";
import { User } from "./user.entity";
import { AttendanceStatus } from "./attendance-record.entity";

export type SupervisorAttendanceEntry = {
  studentId: string;
  status: AttendanceStatus;
  note: string;
};

/**
 * An independent supervisor observation of a teacher-owned timetable occurrence.
 * It deliberately is not an AttendanceSession: the teacher record remains the
 * canonical attendance source and the two can be reconciled by the principal.
 */
@Entity("attendance_supervisor_checks")
@Index(
  "UQ_attendance_supervisor_check_session_supervisor",
  ["session", "supervisor"],
  {
    unique: true,
  },
)
@Index("IDX_attendance_supervisor_check_org_created", [
  "organization",
  "createdAt",
])
export class AttendanceSupervisorCheck {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Organization, { nullable: false, onDelete: "CASCADE" })
  organization!: Organization;

  @ManyToOne(() => AttendanceSession, { nullable: false, onDelete: "CASCADE" })
  session!: AttendanceSession;

  @ManyToOne(() => User, { nullable: false, onDelete: "RESTRICT" })
  supervisor!: User;

  @Column({ type: "simple-json", default: "[]" })
  entries!: SupervisorAttendanceEntry[];

  @Column({ type: "integer", default: 0 }) revision!: number;

  @Column({ type: "datetime", nullable: true }) submittedAt?: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
