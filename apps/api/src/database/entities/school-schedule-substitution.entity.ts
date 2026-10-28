import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { SchoolScheduleEntry } from "./school-schedule-entry.entity";
import { SchoolScheduleTimeBlock } from "./school-schedule-time-block.entity";
import { User } from "./user.entity";

@Entity("school_schedule_occurrence_overrides")
@Index(["entryId", "date"], { unique: true })
export class SchoolScheduleOccurrenceOverride {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "varchar", length: 36 }) entryId!: string;
  @ManyToOne(() => SchoolScheduleEntry, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "entryId" })
  entry?: SchoolScheduleEntry;
  @Column({ type: "varchar", length: 10 }) date!: string;
  @Column({ default: true }) cancelled!: boolean;
  /** Identifies cancellations made by a teacher leave so early return can restore only them. */
  @Column({ type: "varchar", length: 36, nullable: true }) leaveRequestId?:
    string | null;
  @Column({ type: "varchar", length: 36 }) changedById!: string;
  @ManyToOne(() => User, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "changedById" })
  changedBy?: User;
  @CreateDateColumn() createdAt!: Date;
}

@Entity("school_schedule_substitution_requests")
@Index(["sourceEntryId", "freezeDate"], { unique: true })
export class SchoolScheduleSubstitutionRequest {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "varchar", length: 36 }) sourceEntryId!: string;
  @ManyToOne(() => SchoolScheduleEntry, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "sourceEntryId" })
  sourceEntry?: SchoolScheduleEntry;
  @Column({ type: "varchar", length: 36 }) targetEntryId!: string;
  @ManyToOne(() => SchoolScheduleEntry, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "targetEntryId" })
  targetEntry?: SchoolScheduleEntry;
  @Column({ type: "varchar", length: 10 }) freezeDate!: string;
  @Column({ type: "varchar", length: 10 }) replacementDate!: string;
  @Column({ type: "varchar", length: 36 }) replacementTimeBlockId!: string;
  @ManyToOne(() => SchoolScheduleTimeBlock, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "replacementTimeBlockId" })
  replacementTimeBlock?: SchoolScheduleTimeBlock;
  @Column({ type: "varchar", length: 160 }) title!: string;
  @Column({ type: "text", default: "" }) message!: string;
  @Column({ type: "varchar", length: 12, default: "pending" }) status!:
    "pending" | "approved" | "rejected";
  @Column({ type: "varchar", length: 36 }) requestedById!: string;
  @ManyToOne(() => User, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "requestedById" })
  requestedBy?: User;
  @Column({ type: "varchar", length: 36, nullable: true }) reviewedById!:
    string | null;
  @Column({ type: "datetime", nullable: true }) reviewedAt!: Date | null;
  @Column({ type: "varchar", length: 36, nullable: true }) replacementEntryId!:
    string | null;
  @ManyToOne(() => SchoolScheduleEntry, {
    nullable: true,
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "replacementEntryId" })
  replacementEntry?: SchoolScheduleEntry | null;
  @Column({ type: "varchar", length: 36, nullable: true })
  counterpartReplacementEntryId!: string | null;
  @ManyToOne(() => SchoolScheduleEntry, {
    nullable: true,
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "counterpartReplacementEntryId" })
  counterpartReplacementEntry?: SchoolScheduleEntry | null;
  @CreateDateColumn() createdAt!: Date;
}
