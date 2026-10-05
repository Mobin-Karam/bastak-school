import {
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { EducationClass } from "./education-class.entity";
import { Student } from "./student.entity";

@Entity("education_class_enrollments")
@Index(["classroom", "student"], { unique: true })
export class EducationClassEnrollment {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @ManyToOne(() => EducationClass, (classroom) => classroom.enrollments, {
    onDelete: "CASCADE",
  })
  classroom!: EducationClass;
  @ManyToOne(() => Student, { onDelete: "CASCADE" }) student!: Student;
  @CreateDateColumn() createdAt!: Date;
}
