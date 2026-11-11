import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { ClassBookGradeSession } from "./class-book-grade-session.entity";
import { Student } from "./student.entity";
import { User } from "./user.entity";

/** One student's grade in a named class-book assessment session. */
@Entity("class_book_grades")
@Index(["session", "student"], { unique: true })
export class ClassBookGrade {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @ManyToOne(() => ClassBookGradeSession, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  session!: ClassBookGradeSession;
  @ManyToOne(() => Student, { nullable: false, onDelete: "CASCADE" })
  student!: Student;
  @Column({ type: "real" }) score!: number;
  @Column({ type: "varchar", length: 500, default: "" }) note!: string;
  @ManyToOne(() => User, { nullable: false, onDelete: "RESTRICT" })
  updatedBy!: User;
  @Column({ type: "datetime", nullable: true }) principalEditedAt!: Date | null;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
