import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { AttendanceRecord } from "./attendance-record.entity";
import { AttendanceSession } from "./attendance-session.entity";
import { User } from "./user.entity";

/** Immutable business evidence for an authorized change to a submitted attendance fact. */
@Entity("attendance_corrections")
@Index("IDX_attendance_correction_record_created", [
  "record",
  "createdAt",
  "id",
])
@Index(
  "UQ_attendance_correction_record_actor_request",
  ["record", "actor", "requestId"],
  {
    unique: true,
  },
)
export class AttendanceCorrection {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @ManyToOne(() => AttendanceSession, { nullable: false, onDelete: "CASCADE" })
  session!: AttendanceSession;
  @ManyToOne(() => AttendanceRecord, { nullable: false, onDelete: "CASCADE" })
  record!: AttendanceRecord;
  @ManyToOne(() => User, { nullable: false, onDelete: "RESTRICT" })
  actor!: User;
  @Column({ length: 36 }) requestId!: string;
  @Column({ type: "simple-json" }) before!: Record<string, unknown>;
  @Column({ type: "simple-json" }) after!: Record<string, unknown>;
  @Column({ type: "text" }) reason!: string;
  @Column({ length: 16, default: "approved" }) status!: "pending" | "approved" | "rejected";
  @ManyToOne(() => User, { nullable: true, onDelete: "RESTRICT" })
  reviewedBy?: User | null;
  @Column({ type: "varchar", length: 36, nullable: true }) reviewRequestId?: string | null;
  @Column({ type: "text", default: "" }) reviewNote!: string;
  @Column({ type: "datetime", nullable: true }) reviewedAt?: Date | null;
  @CreateDateColumn() createdAt!: Date;
}
