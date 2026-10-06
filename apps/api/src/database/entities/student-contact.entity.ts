import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Student } from "./student.entity";
import { User } from "./user.entity";

export type StudentContactType = "FATHER" | "MOTHER" | "LEGAL_GUARDIAN" | "EMERGENCY";

@Entity("student_contacts")
@Index(["student", "type"], { unique: true })
export class StudentContact {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @ManyToOne(() => Student, { onDelete: "CASCADE" }) student!: Student;
  @Column({ length: 24 }) type!: StudentContactType;
  @Column({ length: 160 }) fullName!: string;
  @Column({ type: "varchar", length: 10, nullable: true }) nationalCode?: string | null;
  @Column({ type: "varchar", length: 24, nullable: true }) phoneNumber?: string | null;
  @Column({ type: "varchar", length: 160, nullable: true }) occupation?: string | null;
  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" }) linkedUser?: User | null;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
