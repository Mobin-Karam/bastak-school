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

@Entity("leave_requests")
export class LeaveRequest {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @ManyToOne(() => Organization, { onDelete: "CASCADE" })
  organization!: Organization;

  @Index()
  @ManyToOne(() => Student, { onDelete: "CASCADE" })
  student!: Student;

  @Column({ length: 80, default: "general" })
  leaveType!: string;

  @Column({ type: "datetime" })
  startDate!: Date;

  @Column({ type: "datetime" })
  endDate!: Date;

  @Column({ type: "text" })
  reason!: string;

  @Column({ type: "text", default: "" })
  note!: string;

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
