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

export enum ExitPermissionStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
}

@Entity("exit_permissions")
export class ExitPermission {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @ManyToOne(() => Organization, { nullable: false, onDelete: "CASCADE" })
  organization!: Organization;

  @Index()
  @ManyToOne(() => Student, { nullable: false, onDelete: "CASCADE" })
  student!: Student;

  @Column({ type: "datetime" })
  requestedDepartureAt!: Date;

  @Column({ type: "datetime", nullable: true })
  expectedReturnAt?: Date | null;

  @Column({ type: "datetime", nullable: true })
  actualDepartureAt?: Date | null;

  @Column({ type: "datetime", nullable: true })
  actualReturnAt?: Date | null;

  /** The student asks to be checked back in; a gate staff member confirms it. */
  @Column({ type: "datetime", nullable: true })
  returnRequestedAt?: Date | null;

  @Column({ type: "text", default: "" })
  returnRequestNote!: string;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  returnVerifiedBy?: User | null;

  @Column({ type: "datetime", nullable: true })
  returnVerifiedAt?: Date | null;

  @Column({ length: 200 })
  destination!: string;

  @Column({ type: "text" })
  reason!: string;

  @Column({ type: "text", default: "" })
  note!: string;

  @Column({
    type: "varchar",
    length: 16,
    default: ExitPermissionStatus.PENDING,
  })
  status!: ExitPermissionStatus;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  approver?: User | null;

  @Column({ type: "datetime", nullable: true })
  reviewedAt?: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
