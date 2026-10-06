import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Student } from "./student.entity";

@Entity("student_profiles")
export class StudentProfile {
  @PrimaryGeneratedColumn("uuid") id!: string;

  @OneToOne(() => Student, { onDelete: "CASCADE" })
  @JoinColumn()
  student!: Student;

  @Column({ type: "varchar", length: 50, nullable: true }) birthCertificateNumber?: string | null;
  @Column({ type: "datetime", nullable: true }) birthDate?: Date | null;
  @Column({ type: "varchar", length: 120, nullable: true }) birthPlace?: string | null;
  @Column({ type: "varchar", length: 120, nullable: true }) certificateIssuePlace?: string | null;
  @Column({ type: "varchar", length: 24, nullable: true }) gender?: string | null;
  @Column({ type: "varchar", length: 240, nullable: true }) previousSchool?: string | null;
  @Column({ type: "text", nullable: true }) address?: string | null;
  @Column({ type: "varchar", length: 10, nullable: true }) postalCode?: string | null;
  @Column({ type: "varchar", length: 24, nullable: true }) homePhone?: string | null;
  @Column({ type: "varchar", length: 24, nullable: true }) emergencyPhone?: string | null;
  @Column({ type: "text", nullable: true }) healthNotes?: string | null;
  @Column({ type: "varchar", length: 160, nullable: true }) insuranceProvider?: string | null;
  @Column({ type: "varchar", length: 160, nullable: true }) insuranceNumber?: string | null;
  @Column({ type: "text", nullable: true }) transportNotes?: string | null;

  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
