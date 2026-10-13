import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("teaching_assignments")
@Index(["organizationId", "teacherId", "startsOn", "endsOn"])
export class TeachingAssignment {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "varchar", length: 36 }) organizationId!: string;
  @ManyToOne("Organization", { onDelete: "RESTRICT" })
  @JoinColumn({ name: "organizationId" })
  organization?: object;
  @Column({ type: "varchar", length: 36 }) academicYearId!: string;
  @ManyToOne("TimetableAcademicYear", { onDelete: "RESTRICT" })
  @JoinColumn({ name: "academicYearId" })
  year?: object;
  @Column({ type: "varchar", length: 36, nullable: true }) termId!:
    string | null;
  @ManyToOne("TimetableTerm", { nullable: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "termId" })
  term?: object;
  @Column({ type: "varchar", length: 36 }) classroomId!: string;
  @ManyToOne("EducationClass", { onDelete: "RESTRICT" })
  @JoinColumn({ name: "classroomId" })
  classroom?: object;
  @Column({ type: "varchar", length: 36 }) subjectId!: string;
  @ManyToOne("Subject", { onDelete: "RESTRICT" })
  @JoinColumn({ name: "subjectId" })
  subject?: object;
  @Column({ type: "varchar", length: 36 }) teacherId!: string;
  @ManyToOne("User", { onDelete: "RESTRICT" })
  @JoinColumn({ name: "teacherId" })
  teacher?: object;
  @Column({ type: "varchar", length: 10 }) startsOn!: string;
  @Column({ type: "varchar", length: 10 }) endsOn!: string;
  @Column({ type: "varchar", length: 20, default: "ACTIVE" }) status!:
    "ACTIVE" | "ENDED";
  @Column({ type: "varchar", length: 36 }) createdById!: string;
  @ManyToOne("User", { onDelete: "RESTRICT" })
  @JoinColumn({ name: "createdById" })
  createdBy?: object;
  @CreateDateColumn() createdAt!: Date;
}
@Entity("subject_book_references")
@Index(["organizationId", "subjectId", "bookId"], { unique: true })
export class SubjectBookReference {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "varchar", length: 36 }) organizationId!: string;
  @ManyToOne("Organization", { onDelete: "RESTRICT" })
  @JoinColumn({ name: "organizationId" })
  organization?: object;
  @Column({ type: "varchar", length: 36 }) subjectId!: string;
  @ManyToOne("Subject", { onDelete: "RESTRICT" })
  @JoinColumn({ name: "subjectId" })
  subject?: object;
  @Column({ type: "varchar", length: 120 }) bookId!: string;
  @ManyToOne("EducationBook", { onDelete: "RESTRICT" })
  @JoinColumn({ name: "bookId" })
  book?: object;
  @CreateDateColumn() createdAt!: Date;
}
@Entity("class_enrollment_history")
@Index(["organizationId", "classroomId", "createdAt", "id"])
export class ClassEnrollmentHistory {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "varchar", length: 36 }) organizationId!: string;
  @ManyToOne("Organization", { onDelete: "RESTRICT" })
  @JoinColumn({ name: "organizationId" })
  organization?: object;
  @Column({ type: "varchar", length: 36 }) classroomId!: string;
  @ManyToOne("EducationClass", { onDelete: "RESTRICT" })
  @JoinColumn({ name: "classroomId" })
  classroom?: object;
  @Column({ type: "varchar", length: 36 }) actorId!: string;
  @ManyToOne("User", { onDelete: "RESTRICT" })
  @JoinColumn({ name: "actorId" })
  actor?: object;
  @Column({ type: "simple-json" }) beforeStudentIds!: string[];
  @Column({ type: "simple-json" }) afterStudentIds!: string[];
  @CreateDateColumn() createdAt!: Date;
}
