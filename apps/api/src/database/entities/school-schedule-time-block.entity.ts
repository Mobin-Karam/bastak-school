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

export type ScheduleTimeBlockPartOfDay = "AM" | "PM";

/** Reusable organization-scoped start/end ranges for legacy schedule sessions. */
@Entity("school_schedule_time_blocks")
@Index(["organization", "name", "partOfDay"], { unique: true })
export class SchoolScheduleTimeBlock {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @ManyToOne(() => Organization, { nullable: false, onDelete: "CASCADE" })
  organization!: Organization;
  @Column({ length: 80 }) name!: string;
  @Column({ length: 5 }) startTime!: string;
  @Column({ length: 5 }) endTime!: string;
  /** Derived on the server from startTime; callers never choose it. */
  @Column({ length: 2, default: "AM" }) partOfDay!: ScheduleTimeBlockPartOfDay;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
