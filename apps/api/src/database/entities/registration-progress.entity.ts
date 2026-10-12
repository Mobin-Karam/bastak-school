import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Organization } from "./organization.entity";
import { Student } from "./student.entity";
import { RegistrationSectionCode } from "./registration-requirement.entity";

export type RegistrationSectionStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "APPROVED"
  | "NEEDS_CORRECTION"
  | "VERIFIED"
  | "REJECTED";

@Entity("registration_progress")
@Index(["student", "organization", "sectionCode"], { unique: true })
export class RegistrationProgress {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @ManyToOne(() => Student, { nullable: false, onDelete: "CASCADE" })
  student!: Student;
  @ManyToOne(() => Organization, { nullable: false, onDelete: "CASCADE" })
  organization!: Organization;
  @Column({ length: 48 }) sectionCode!: RegistrationSectionCode;
  @Column({ length: 24, default: "NOT_STARTED" })
  status!: RegistrationSectionStatus;
  @Column({ type: "text", default: "" }) reviewNote!: string;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
