import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { AttendanceSession } from "./attendance-session.entity";
import { Organization } from "./organization.entity";
import { User } from "./user.entity";

export type AttendanceWriteResult = {
  sessionId: string;
  revision?: number;
  status?: import("./attendance-session.entity").AttendanceSessionStatus;
  count: number;
  records: Array<{
    id: string;
    studentId: string;
    status: string;
    note: string;
  }>;
};

/** A committed attendance request can be retried without creating another session. */
@Entity("attendance_write_receipts")
@Index(
  "IDX_attendance_request_receipt",
  ["organization", "actor", "requestId"],
  { unique: true },
)
export class AttendanceWriteReceipt {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @ManyToOne(() => Organization, { onDelete: "CASCADE" })
  organization!: Organization;
  @ManyToOne(() => User, { onDelete: "CASCADE" }) actor!: User;
  @ManyToOne(() => AttendanceSession, { onDelete: "CASCADE" })
  session!: AttendanceSession;
  @Column({ length: 36 }) requestId!: string;
  @Column({ length: 64 }) fingerprint!: string;
  @Column({ type: "simple-json" }) result!: AttendanceWriteResult;
  @CreateDateColumn() createdAt!: Date;
}
