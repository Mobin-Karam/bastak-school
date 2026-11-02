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
import { Student } from "./student.entity";
import { User } from "./user.entity";

export enum LeaveRequestStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
}

/** The only student-requestable workflow paths. */
export enum LeaveRequestType {
  SCHOOL_EXIT = "SCHOOL_EXIT",
  LEAVE = "LEAVE",
}

/** Role that owns the first approval decision for a request. */
export enum LeaveRequestReviewerRole {
  PRINCIPAL = "PRINCIPAL",
  SCHOOL_SUPERVISOR = "SCHOOL_SUPERVISOR",
}

@Entity("leave_requests")
export class LeaveRequest {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @ManyToOne(() => Organization, { nullable: false, onDelete: "CASCADE" })
  organization!: Organization;

  @Index()
  @ManyToOne(() => Student, { nullable: false, onDelete: "CASCADE" })
  student!: Student;

  @Column({ length: 80, default: LeaveRequestType.LEAVE })
  leaveType!: string;

  @Column({ length: 32, default: LeaveRequestReviewerRole.PRINCIPAL })
  reviewerRole!: LeaveRequestReviewerRole;

  @Column({ type: "datetime" })
  startDate!: Date;

  @Column({ type: "datetime" })
  endDate!: Date;

  @Column({ type: "text" })
  reason!: string;

  @Column({ type: "text", default: "" })
  note!: string;

  @Column({ type: "boolean", default: false })
  includesLunch!: boolean;

  @Column({ type: "boolean", default: false })
  includesDinner!: boolean;

  /** Linked approved movement; it makes the requested departure time auditable. */
  @Column({ type: "varchar", nullable: true })
  exitPermissionId?: string | null;

  @Column({ type: "simple-array", default: "" })
  attachments!: string[];

  @Column({ type: "varchar", length: 16, default: LeaveRequestStatus.PENDING })
  status!: LeaveRequestStatus;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  approver?: User | null;

  @Column({ type: "datetime", nullable: true })
  reviewedAt?: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
