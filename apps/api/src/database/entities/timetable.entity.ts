import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from "typeorm";
@Entity("timetable_academic_years")
@Index(["organizationId", "name"], { unique: true })
export class TimetableAcademicYear {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "varchar", length: 36 }) organizationId!: string;
  @ManyToOne("Organization", { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "organizationId" })
  organization?: object;
  @Column({ type: "varchar", length: 240 }) name!: string;
  @Column({ type: "varchar", length: 10 }) startsOn!: string;
  @Column({ type: "varchar", length: 10 }) endsOn!: string;
  @Column({ type: "varchar", length: 64, default: "Asia/Tehran" })
  timeZone!: string;
  @Column({ type: "boolean", default: false }) active!: boolean;
  @CreateDateColumn() createdAt!: Date;
}
@Entity("timetable_terms")
@Index(["yearId", "name"], { unique: true })
export class TimetableTerm {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "varchar", length: 36 }) yearId!: string;
  @ManyToOne("TimetableAcademicYear", { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "yearId" })
  year?: object;
  @Column({ type: "varchar", length: 240 }) name!: string;
  @Column({ type: "varchar", length: 10 }) startsOn!: string;
  @Column({ type: "varchar", length: 10 }) endsOn!: string;
  @CreateDateColumn() createdAt!: Date;
}
@Entity("timetable_sections")
@Index(["organizationId", "name"], { unique: true })
export class TimetableSection {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "varchar", length: 36 }) organizationId!: string;
  @ManyToOne("Organization", { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "organizationId" })
  organization?: object;
  @Column({ type: "varchar", length: 240 }) name!: string;
  @CreateDateColumn() createdAt!: Date;
}
@Entity("timetable_locations")
@Index(["organizationId", "name"], { unique: true })
export class TimetableLocation {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "varchar", length: 36 }) organizationId!: string;
  @ManyToOne("Organization", { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "organizationId" })
  organization?: object;
  @Column({ type: "varchar", length: 240 }) name!: string;
  @Column({ type: "integer", default: 0 }) capacity!: number;
  @CreateDateColumn() createdAt!: Date;
}
@Entity("timetable_bells")
@Index(["organizationId", "name"], { unique: true })
export class TimetableBellSchedule {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "varchar", length: 36 }) organizationId!: string;
  @ManyToOne("Organization", { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "organizationId" })
  organization?: object;
  @Column({ type: "varchar", length: 36, nullable: true }) sectionId!:
    string | null;
  @ManyToOne("TimetableSection", { nullable: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "sectionId" })
  section?: object;
  @Column({ type: "varchar", length: 240 }) name!: string;
  @CreateDateColumn() createdAt!: Date;
}
@Entity("timetable_daily_sessions")
@Index(["bellId", "name"], { unique: true })
export class TimetableDailySession {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "varchar", length: 36 }) bellId!: string;
  @ManyToOne("TimetableBellSchedule", { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "bellId" })
  bell?: object;
  @Column({ type: "varchar", length: 240 }) name!: string;
  @Column({ type: "varchar", length: 20, default: "MORNING" }) kind!:
    "MORNING" | "AFTERNOON" | "OTHER";
  @Column({ type: "varchar", length: 5 }) startTime!: string;
  @Column({ type: "varchar", length: 5 }) endTime!: string;
  @CreateDateColumn() createdAt!: Date;
}
@Entity("timetable_periods")
@Index(["sessionId", "ordinal"], { unique: true })
export class TimetablePeriod {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "varchar", length: 36 }) sessionId!: string;
  @ManyToOne("TimetableDailySession", { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "sessionId" })
  session?: object;
  @Column({ type: "varchar", length: 240 }) name!: string;
  @Column({ type: "integer", default: 0 }) ordinal!: number;
  @Column({ type: "varchar", length: 5 }) startTime!: string;
  @Column({ type: "varchar", length: 5 }) endTime!: string;
  @CreateDateColumn() createdAt!: Date;
}
@Entity("timetable_versions")
export class TimetableVersion {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "varchar", length: 36 }) termId!: string;
  @ManyToOne("TimetableTerm", { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "termId" })
  term?: object;
  @Column({ type: "varchar", length: 240 }) name!: string;
  @Column({ type: "varchar", length: 20, default: "DRAFT" }) state!:
    "DRAFT" | "PUBLISHED" | "ARCHIVED";
  @Column({ type: "integer", default: 0 }) revision!: number;
  @Column({ type: "varchar", length: 10 }) effectiveOn!: string;
  @Column({ type: "datetime", nullable: true }) publishedAt!: Date | null;
  @Column({ type: "text", default: "" }) reason!: string;
  @Column({ type: "varchar", length: 36 }) createdById!: string;
  @ManyToOne("User", { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "createdById" })
  createdBy?: object;
  @CreateDateColumn() createdAt!: Date;
}
@Entity("timetable_holidays")
@Index(["termId", "date"], { unique: true })
export class TimetableHoliday {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "varchar", length: 36 }) termId!: string;
  @ManyToOne("TimetableTerm", { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "termId" })
  term?: object;
  @Column({ type: "varchar", length: 10 }) date!: string;
  @Column({ type: "varchar", length: 240 }) name!: string;
  @CreateDateColumn() createdAt!: Date;
}
@Entity("timetable_teacher_availability")
export class TimetableTeacherAvailability {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "varchar", length: 36 }) organizationId!: string;
  @ManyToOne("Organization", { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "organizationId" })
  organization?: object;
  @Column({ type: "varchar", length: 36 }) teacherId!: string;
  @ManyToOne("User", { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "teacherId" })
  teacher?: object;
  @Column({ type: "integer", default: 0 }) weekday!: number;
  @Column({ type: "varchar", length: 5 }) startTime!: string;
  @Column({ type: "varchar", length: 5 }) endTime!: string;
  @Column({ type: "varchar", length: 10 }) startsOn!: string;
  @Column({ type: "varchar", length: 10 }) endsOn!: string;
  @Column({ type: "text", default: "" }) reason!: string;
  @CreateDateColumn() createdAt!: Date;
}
@Entity("timetable_allocations")
@Index(["versionId", "classBookId"], { unique: true })
export class TimetableAllocation {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "varchar", length: 36 }) versionId!: string;
  @ManyToOne("TimetableVersion", { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "versionId" })
  version?: object;
  @Column({ type: "varchar", length: 36 }) classroomId!: string;
  @ManyToOne("EducationClass", { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "classroomId" })
  classroom?: object;
  @Column({ type: "varchar", length: 36 }) classBookId!: string;
  @ManyToOne("EducationClassBook", { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "classBookId" })
  classBook?: object;
  @Column({ type: "integer", default: 0 }) lessonsPerWeek!: number;
  @CreateDateColumn() createdAt!: Date;
}
@Entity("timetable_overrides")
@Index(["lessonId", "date"], { unique: true })
export class TimetableOverride {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "varchar", length: 36 }) versionId!: string;
  @ManyToOne("TimetableVersion", { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "versionId" })
  version?: object;
  @Column({ type: "varchar", length: 36 }) lessonId!: string;
  @ManyToOne("SchoolScheduleEntry", { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "lessonId" })
  lesson?: object;
  @Column({ type: "varchar", length: 10 }) date!: string;
  @Column({ type: "boolean", default: false }) cancelled!: boolean;
  @Column({ type: "varchar", length: 36, nullable: true }) teacherId!:
    string | null;
  @ManyToOne("User", { nullable: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "teacherId" })
  teacher?: object;
  @Column({ type: "varchar", length: 36, nullable: true }) locationId!:
    string | null;
  @ManyToOne("TimetableLocation", { nullable: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "locationId" })
  location?: object;
  @Column({ type: "varchar", length: 5, nullable: true }) startTime!:
    string | null;
  @Column({ type: "varchar", length: 5, nullable: true }) endTime!:
    string | null;
  @Column({ type: "text", default: "" }) reason!: string;
  @Column({ type: "varchar", length: 36 }) changedById!: string;
  @ManyToOne("User", { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "changedById" })
  changedBy?: object;
  @Column({ type: "varchar", length: 240 }) changedByName!: string;
  @CreateDateColumn() createdAt!: Date;
}
@Entity("timetable_occurrences")
@Index(["lessonId", "date"], { unique: true })
export class TimetableOccurrence {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "varchar", length: 36 }) lessonId!: string;
  @ManyToOne("SchoolScheduleEntry", { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "lessonId" })
  lesson?: object;
  @Column({ type: "varchar", length: 10 }) date!: string;
  @Column({ type: "varchar", length: 36, nullable: true })
  attendanceSessionId!: string | null;
  @ManyToOne("AttendanceSession", { nullable: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "attendanceSessionId" })
  attendanceSession?: object;
  @CreateDateColumn() createdAt!: Date;
}
@Entity("timetable_changes")
export class TimetableChange {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "varchar", length: 36 }) versionId!: string;
  @ManyToOne("TimetableVersion", { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "versionId" })
  version?: object;
  @Column({ type: "varchar", length: 36, nullable: true }) lessonId!:
    string | null;
  @ManyToOne("SchoolScheduleEntry", { nullable: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "lessonId" })
  lesson?: object;
  @Column({ type: "varchar", length: 240 }) action!: string;
  @Column({ type: "text", default: "" }) reason!: string;
  @Column({ type: "varchar", length: 36 }) actorId!: string;
  @ManyToOne("User", { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "actorId" })
  actor?: object;
  @Column({ type: "varchar", length: 240 }) actorName!: string;
  @Column({ type: "text", default: "" }) beforeText!: string;
  @Column({ type: "text", default: "" }) afterText!: string;
  @CreateDateColumn() createdAt!: Date;
}
@Entity("timetable_imports")
export class TimetableImport {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "varchar", length: 36 }) versionId!: string;
  @ManyToOne("TimetableVersion", { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "versionId" })
  version?: object;
  @Column({ type: "varchar", length: 36 }) actorId!: string;
  @ManyToOne("User", { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "actorId" })
  actor?: object;
  @Column({ type: "varchar", length: 240 }) filename!: string;
  @Column({ type: "varchar", length: 240 }) sheetName!: string;
  @Column({ type: "integer", default: 0 }) rowCount!: number;
  @Column({ type: "integer", default: 0 }) revision!: number;
  @CreateDateColumn() createdAt!: Date;
}
