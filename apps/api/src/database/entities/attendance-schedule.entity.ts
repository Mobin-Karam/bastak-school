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
import { User } from "./user.entity";

/** Recurring study-group meetings and dormitory roll calls use the same engine as classes. */
@Entity("attendance_schedules")
@Index(["organization", "weekday", "status"])
export class AttendanceSchedule {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @ManyToOne(() => Organization, { onDelete: "CASCADE" })
  organization!: Organization;
  @Column({ length: 24 }) contextType!: "class_group" | "dorm";
  @Column({ length: 120 }) contextId!: string;
  @Column({ length: 160 }) title!: string;
  @Column({ type: "integer" }) weekday!: number;
  @Column({ length: 5 }) startTime!: string;
  @Column({ length: 5 }) endTime!: string;
  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  assignedStaff?: User | null;
  @Column({ length: 20, default: "ACTIVE" }) status!: "ACTIVE" | "ARCHIVED";
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
