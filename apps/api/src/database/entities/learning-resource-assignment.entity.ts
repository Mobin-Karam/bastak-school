import {
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { LearningResource } from "./learning-resource.entity";
import { Student } from "./student.entity";

@Entity("learning_resource_assignments")
@Unique(["resource", "student"])
export class LearningResourceAssignment {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index()
  @ManyToOne(() => LearningResource, (resource) => resource.assignments, {
    nullable: false,
    onDelete: "CASCADE",
  })
  resource!: LearningResource;
  @Index()
  @ManyToOne(() => Student, { nullable: false, onDelete: "CASCADE" })
  student!: Student;
  @CreateDateColumn() assignedAt!: Date;
}
