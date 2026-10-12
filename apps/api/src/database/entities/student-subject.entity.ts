import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Student } from "./student.entity";
import { Subject } from "./subject.entity";
@Entity("student_subjects")
@Index(["student", "subject"], { unique: true })
export class StudentSubject {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @ManyToOne(() => Student, { nullable: false, onDelete: "CASCADE" })
  student!: Student;
  @ManyToOne(() => Subject, { nullable: false, onDelete: "RESTRICT" })
  subject!: Subject;
  @Column({ default: true }) enabled!: boolean;
  @Column({ length: 120, default: "" }) displayName!: string;
  @Column({ default: 0 }) weeklyTargetMinutes!: number;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
