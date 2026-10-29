import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { AttendanceSession } from "./attendance-session.entity";
import { Organization } from "./organization.entity";
import { Student } from "./student.entity";
import { User } from "./user.entity";

/** Private operational observation from the assigned teacher to the principal. */
@Entity("teacher_student_reports")
@Index(["organization", "seenAt"])
@Index(["student", "createdAt"])
export class TeacherStudentReport {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @ManyToOne(() => Organization, { nullable: false, onDelete: "CASCADE" })
  organization!: Organization;
  @ManyToOne(() => Student, { nullable: false, onDelete: "CASCADE" })
  student!: Student;
  @ManyToOne(() => AttendanceSession, { nullable: false, onDelete: "CASCADE" })
  session!: AttendanceSession;
  @ManyToOne(() => User, { nullable: false, onDelete: "RESTRICT" })
  teacher!: User;
  @Column({ type: "varchar", length: 36, nullable: true })
  academicYearIdSnapshot?: string | null;
  @Column({ type: "varchar", length: 120, nullable: true })
  academicYearNameSnapshot?: string | null;
  @Column({ type: "varchar", length: 36, nullable: true }) termIdSnapshot?:
    string | null;
  @Column({ type: "varchar", length: 120, nullable: true }) termNameSnapshot?:
    string | null;
  @Column({ type: "varchar", length: 2000 }) message!: string;
  @Column({ type: "datetime", nullable: true }) seenAt!: Date | null;
  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  seenBy!: User | null;
  /** Principal follow-up instruction. The underlying teacher report stays immutable. */
  @Column({ type: "varchar", length: 32, nullable: true }) principalAction?:
    "full_screen_summons" | "contact_request" | null;
  @Column({ type: "text", default: "" }) principalActionNote!: string;
  @Column({ type: "datetime", nullable: true }) principalActionAt?: Date | null;
  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  principalActionBy?: User | null;
  @CreateDateColumn() createdAt!: Date;
}
