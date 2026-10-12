import {
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Student } from "./student.entity";
import type { StudyGroup } from "./study-group.entity";

@Entity("study_group_memberships")
@Index(["group", "student"], { unique: true })
export class StudyGroupMembership {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne("StudyGroup", (group: StudyGroup) => group.memberships, {
    nullable: false,
    onDelete: "CASCADE",
  })
  group!: StudyGroup;

  @ManyToOne(() => Student, { nullable: false, onDelete: "CASCADE" })
  student!: Student;

  @CreateDateColumn()
  createdAt!: Date;
}
