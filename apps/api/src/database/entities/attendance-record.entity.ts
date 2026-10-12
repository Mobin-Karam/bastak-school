import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { AttendanceSession } from "./attendance-session.entity";
import { Student } from "./student.entity";
import { User } from "./user.entity";

export enum AttendanceStatus {
  PRESENT = "present",
  ABSENT = "absent",
  LATE = "late",
  EXCUSED = "excused",
}

/** A manager's decision on the reason recorded for an absence. */
export enum AttendanceReviewStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

@Entity("attendance_records")
@Index(["session", "student"], { unique: true })
export class AttendanceRecord {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne("AttendanceSession", (session: AttendanceSession) => session.records, {
    onDelete: "CASCADE",
  })
  session!: AttendanceSession;

  @ManyToOne(() => Student, { onDelete: "CASCADE" })
  student!: Student;

  @Column({ type: "varchar", length: 16, default: AttendanceStatus.PRESENT })
  status!: AttendanceStatus;

  @Column({ type: "text", default: "" })
  note!: string;

  /** Legacy projection `status` remains readable; this is the physical observation. */
  @Column({ type: "varchar", length: 20, nullable: true }) physicalStatus?:
    "present" | "absent" | "late" | "legacy_unknown" | null;
  @Column({ type: "integer", default: 0 }) revision!: number;
  @Column({ type: "integer", nullable: true }) minutesLate?: number | null;
  @Column({ type: "datetime", nullable: true }) arrivalAt?: Date | null;

  @Column({ type: "varchar", length: 16, nullable: true })
  reviewStatus?: AttendanceReviewStatus | null;

  @Column({ type: "text", default: "" })
  reviewNote!: string;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  reviewedBy?: User | null;

  @Column({ type: "datetime", nullable: true })
  reviewedAt?: Date | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  recordedBy?: User | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
