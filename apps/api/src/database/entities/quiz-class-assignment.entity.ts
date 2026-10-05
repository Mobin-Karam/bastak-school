import { CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { EducationClass } from "./education-class.entity";
import { Quiz } from "./quiz.entity";

/** Audience rule linking a quiz to every active enrollment in a class. */
@Entity("quiz_class_assignments")
@Index(["quiz", "classroom"], { unique: true })
export class QuizClassAssignment {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @ManyToOne(() => Quiz, { onDelete: "CASCADE" }) quiz!: Quiz;
  @ManyToOne(() => EducationClass, { onDelete: "CASCADE" }) classroom!: EducationClass;
  @CreateDateColumn() createdAt!: Date;
}
