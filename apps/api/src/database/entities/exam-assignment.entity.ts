import {
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Exam } from "./exam.entity";
import { Student } from "./student.entity";
import { User } from "./user.entity";
@Entity("exam_assignments")
@Index(["exam", "student"], { unique: true })
export class ExamAssignment {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @ManyToOne(() => Exam, (exam) => exam.assignments, {
    nullable: false,
    onDelete: "CASCADE",
  })
  exam!: Exam;
  @ManyToOne(() => Student, { nullable: false, onDelete: "CASCADE" })
  student!: Student;
  @ManyToOne(() => User, { nullable: false, onDelete: "RESTRICT" })
  assignedBy!: User;
  @CreateDateColumn() assignedAt!: Date;
  @CreateDateColumn() createdAt!: Date;
}
