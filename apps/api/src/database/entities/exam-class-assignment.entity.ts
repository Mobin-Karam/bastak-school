import {
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { EducationClass } from "./education-class.entity";
import { Exam } from "./exam.entity";

@Entity("exam_class_assignments")
@Index(["exam", "classroom"], { unique: true })
export class ExamClassAssignment {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @ManyToOne(() => Exam, { onDelete: "CASCADE" }) exam!: Exam;
  @ManyToOne(() => EducationClass, { onDelete: "CASCADE" })
  classroom!: EducationClass;
  @CreateDateColumn() createdAt!: Date;
}
