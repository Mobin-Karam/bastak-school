import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Organization } from "./organization.entity";
import { User } from "./user.entity";
import { AttendanceRecord } from "./attendance-record.entity";

export type AttendanceContextType =
  "class" | "class_group" | "study_group" | "dorm" | "night" | "pool";

export type AttendanceSessionStatus =
  "scheduled" | "open" | "draft" | "submitted" | "finalized" | "cancelled";
export type AttendanceRosterSnapshot = {
  id: string;
  name: string;
  nationalCode: string | null;
  userId: string | null;
};

@Entity("attendance_sessions")
@Index("IDX_attendance_session_org_date_id", [
  "organization",
  "sessionDate",
  "id",
])
@Index("IDX_attendance_session_occurrence", ["organization", "occurrenceKey"], {
  unique: true,
})
export class AttendanceSession {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @ManyToOne(() => Organization, { nullable: false, onDelete: "CASCADE" })
  organization!: Organization;

  @Column({ type: "varchar", length: 24 })
  contextType!: AttendanceContextType;

  @Column({ length: 120 })
  contextId!: string;

  @Column({ type: "datetime" })
  sessionDate!: Date;

  @Column({ type: "text", default: "" })
  note!: string;

  @Column({ type: "varchar", length: 240, nullable: true }) occurrenceKey?:
    string | null;
  @Column({ type: "varchar", length: 64, nullable: true })
  creationFingerprint?: string | null;
  @Column({ length: 160, default: "" }) titleSnapshot!: string;
  /** Immutable subject/book identity for timetable-backed lesson reporting. */
  @Column({ type: "varchar", length: 120, nullable: true }) subjectIdSnapshot?:
    string | null;
  @Column({ type: "varchar", length: 240, nullable: true })
  subjectNameSnapshot?: string | null;
  @Column({ type: "varchar", length: 36, nullable: true })
  academicYearIdSnapshot?: string | null;
  @Column({ type: "varchar", length: 240, nullable: true })
  academicYearNameSnapshot?: string | null;
  @Column({ type: "varchar", length: 36, nullable: true }) termIdSnapshot?:
    string | null;
  @Column({ type: "varchar", length: 240, nullable: true }) termNameSnapshot?:
    string | null;
  @Column({ length: 64, default: "Asia/Tehran" }) timeZone!: string;
  @Column({ type: "varchar", length: 10, nullable: true }) operationalDate?:
    string | null;
  @Column({ type: "datetime", nullable: true }) scheduledStartAt?: Date | null;
  @Column({ type: "datetime", nullable: true }) scheduledEndAt?: Date | null;
  @Column({ length: 20, default: "open" }) status!: AttendanceSessionStatus;
  @Column({ type: "integer", default: 0 }) revision!: number;
  @Column({ type: "varchar", length: 8, nullable: true }) attendancePeriod?:
    "day" | "night" | null;
  /** Which student assignment owns this roll call; null is legacy data. */
  @Column({ type: "varchar", length: 16, nullable: true })
  dormAttendanceRole?: "primary" | "room_check" | null;
  @Column({ type: "varchar", length: 36, nullable: true })
  dormDelegateStudentIdSnapshot?: string | null;
  @Column({ type: "varchar", length: 160, nullable: true })
  dormDelegateStudentNameSnapshot?: string | null;
  /** Dorm roll-call review handoff; null dates mean the next reviewer has not acted. */
  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  dormSupervisorReviewedBy?: User | null;
  @Column({ type: "datetime", nullable: true })
  dormSupervisorReviewedAt?: Date | null;
  @Column({ type: "text", nullable: true })
  dormSupervisorNote?: string | null;
  @Column({ type: "datetime", nullable: true })
  dormForwardedAt?: Date | null;
  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  dormPrincipalReviewedBy?: User | null;
  @Column({ type: "datetime", nullable: true })
  dormPrincipalReviewedAt?: Date | null;
  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  assignedStaff?: User | null;
  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  submittedBy?: User | null;
  @Column({ type: "datetime", nullable: true }) submittedAt?: Date | null;
  @Column({ type: "varchar", length: 32, nullable: true }) sourceKind?:
    | "class_schedule"
    | "attendance_schedule"
    | "legacy_schedule"
    | "legacy_import"
    | "exceptional"
    | null;
  @Column({ type: "text", nullable: true }) historicalImportReason?:
    string | null;
  @Column({ type: "varchar", length: 36, nullable: true }) sourceScheduleId?:
    string | null;
  @Column({ type: "datetime", nullable: true }) rosterCapturedAt?: Date | null;
  @Column({ length: 160, default: "" }) assignedStaffNameSnapshot!: string;
  @Column({ type: "simple-json", nullable: true }) rosterSnapshot?:
    AttendanceRosterSnapshot[] | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  createdBy?: User | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => AttendanceRecord, (record) => record.session)
  records!: AttendanceRecord[];
}
