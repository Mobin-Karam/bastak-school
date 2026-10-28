import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Organization } from "./organization.entity";
import { SchoolScheduleTimeBlockGroup } from "./school-schedule-time-block-group.entity";

export type ScheduleTimeBlockPartOfDay = "AM" | "PM";

/** Reusable organization-scoped start/end ranges for legacy schedule sessions. */
@Entity("school_schedule_time_blocks")
@Index(["organization", "group", "name"], { unique: true })
export class SchoolScheduleTimeBlock {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @ManyToOne(() => Organization, { nullable: false, onDelete: "CASCADE" })
  organization!: Organization;
  @ManyToOne(() => SchoolScheduleTimeBlockGroup, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "groupId" })
  group!: SchoolScheduleTimeBlockGroup;
  @Column({ length: 80 }) name!: string;
  @Column({ length: 5 }) startTime!: string;
  @Column({ length: 5 }) endTime!: string;
  /** Retained for compatibility with historical blocks; groups control presentation. */
  @Column({ length: 2, default: "AM" }) partOfDay!: ScheduleTimeBlockPartOfDay;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
