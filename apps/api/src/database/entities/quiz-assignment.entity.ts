import { CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Quiz } from "./quiz.entity";
import { Student } from "./student.entity";

@Entity("quiz_assignments")
@Index(["quiz", "student"], { unique: true })
export class QuizAssignment { @PrimaryGeneratedColumn("uuid") id!: string; @ManyToOne(() => Quiz, { onDelete:"CASCADE" }) quiz!: Quiz; @ManyToOne(() => Student, { onDelete:"CASCADE" }) student!: Student; @CreateDateColumn() createdAt!: Date; }
