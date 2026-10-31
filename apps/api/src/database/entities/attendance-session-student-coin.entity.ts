import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { AttendanceSession } from "./attendance-session.entity";
import { Student } from "./student.entity";
import { User } from "./user.entity";

/** Current teacher-awarded coin total for one student in one attendance session. */
@Entity("attendance_session_student_coins")
@Index("UQ_attendance_session_student_coin", ["session", "student"], {
  unique: true,
})
export class AttendanceSessionStudentCoin {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @ManyToOne(() => AttendanceSession, { nullable: false, onDelete: "CASCADE" })
  session!: AttendanceSession;
  @ManyToOne(() => Student, { nullable: false, onDelete: "CASCADE" })
  student!: Student;
  @Column({ type: "integer", default: 0 }) coins!: number;
  @Column({ type: "integer", default: 0 }) revision!: number;
  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  recordedBy?: User | null;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
