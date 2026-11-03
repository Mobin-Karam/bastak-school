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

export type ScheduleTemplateState = "ACTIVE" | "ARCHIVED";
export type ScheduleTemplateEntry = {
  classroomId?: string | null;
  classBookId?: string | null;
  teacherId?: string | null;
  title: string;
  weekday: number;
  startTime: string;
  endTime: string;
  room: string;
};

@Entity("school_schedule_templates")
@Index(["organization", "state"])
export class SchoolScheduleTemplate {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @ManyToOne(() => Organization, { nullable: false, onDelete: "CASCADE" })
  organization!: Organization;
  @Column({ length: 120 }) name!: string;
  @Column({ length: 20, default: "ACTIVE" }) state!: ScheduleTemplateState;
  @Column({ type: "simple-json", default: "[]" })
  entries!: ScheduleTemplateEntry[];
  /** Null for templates created before term-scoped snapshots were introduced. */
  @Column({ type: "varchar", length: 36, nullable: true })
  sourceAcademicYearId!: string | null;
  @Column({ type: "varchar", length: 36, nullable: true })
  sourceTermId!: string | null;
  @Column({ type: "varchar", length: 120, nullable: true })
  sourceAcademicYearName!: string | null;
  @Column({ type: "varchar", length: 120, nullable: true })
  sourceTermName!: string | null;
  @Column({ type: "datetime", nullable: true }) capturedAt!: Date | null;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
