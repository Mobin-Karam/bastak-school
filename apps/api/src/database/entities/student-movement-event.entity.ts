import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ExitPermission } from "./exit-permission.entity";
import { LeaveRequest } from "./leave-request.entity";
import { Organization } from "./organization.entity";
import { Student } from "./student.entity";
import { User } from "./user.entity";

export type StudentMovementEventType =
  | "requested"
  | "approved"
  | "rejected"
  | "departure_recorded"
  | "return_requested"
  | "return_confirmed"
  | "overdue_escalated"
  | "outside_school_confirmed"
  | "breach_confirmed";

/** Immutable audit trail for the linked leave and physical movement workflow. */
@Entity("student_movement_events")
export class StudentMovementEvent {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @ManyToOne(() => Organization, { nullable: false, onDelete: "CASCADE" })
  organization!: Organization;

  @Index()
  @ManyToOne(() => Student, { nullable: false, onDelete: "CASCADE" })
  student!: Student;

  @Index()
  @ManyToOne(() => LeaveRequest, { nullable: true, onDelete: "SET NULL" })
  leaveRequest?: LeaveRequest | null;

  @Index()
  @ManyToOne(() => ExitPermission, { nullable: true, onDelete: "SET NULL" })
  exitPermission?: ExitPermission | null;

  @Column({ type: "varchar", length: 48 })
  type!: StudentMovementEventType;

  @Column({ type: "text", default: "" })
  note!: string;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  actor?: User | null;

  @CreateDateColumn()
  createdAt!: Date;
}
