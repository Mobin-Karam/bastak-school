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
    // This association is backfilled from a populated SQLite table. SQLite
    // cannot add a non-null foreign-key column in place without rebuilding a
    // table that existing substitution requests already reference. Service
    // methods require a same-organization group for every newly written block.
    nullable: true,
    onDelete: "RESTRICT",
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: "groupId" })
  group?: SchoolScheduleTimeBlockGroup;
  @Column({ length: 80 }) name!: string;
  @Column({ length: 5 }) startTime!: string;
  @Column({ length: 5 }) endTime!: string;
  /** Retained for compatibility with historical blocks; groups control presentation. */
  @Column({ length: 2, default: "AM" }) partOfDay!: ScheduleTimeBlockPartOfDay;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
