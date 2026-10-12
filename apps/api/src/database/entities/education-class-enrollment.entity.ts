import {
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import type { EducationClass } from "./education-class.entity";
import { Student } from "./student.entity";

@Entity("education_class_enrollments")
@Index(["classroom", "student"], { unique: true })
export class EducationClassEnrollment {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @ManyToOne(
    "EducationClass",
    (classroom: EducationClass) => classroom.enrollments,
    { nullable: false, onDelete: "CASCADE" },
  )
  classroom!: EducationClass;
  @ManyToOne(() => Student, { nullable: false, onDelete: "CASCADE" })
  student!: Student;
  @CreateDateColumn() createdAt!: Date;
}
