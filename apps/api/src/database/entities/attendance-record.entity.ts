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

export enum AttendanceStatus {
  PRESENT = "present",
  ABSENT = "absent",
  LATE = "late",
  EXCUSED = "excused",
}

@Entity("attendance_records")
@Index(["session", "student"], { unique: true })
export class AttendanceRecord {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => AttendanceSession, (session) => session.records, { onDelete: "CASCADE" })
  session!: AttendanceSession;

  @ManyToOne(() => Student, { onDelete: "CASCADE" })
  student!: Student;

  @Column({ type: "varchar", length: 16, default: AttendanceStatus.PRESENT })
  status!: AttendanceStatus;

  @Column({ type: "text", default: "" })
  note!: string;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  recordedBy?: User | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
