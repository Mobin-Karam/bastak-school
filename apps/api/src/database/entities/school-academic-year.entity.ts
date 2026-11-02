import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Organization } from "./organization.entity";

@Entity("school_academic_years")
@Index(["organizationId", "name"], { unique: true })
export class SchoolAcademicYear {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "varchar", length: 36 }) organizationId!: string;
  @ManyToOne(() => Organization, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "organizationId" })
  organization?: Organization;
  @Column({ length: 120 }) name!: string;
  @Column({ type: "varchar", length: 10 }) startsOn!: string;
  @Column({ type: "varchar", length: 10 }) endsOn!: string;
  @Column({ type: "varchar", length: 16, default: "DRAFT" }) state!:
    "DRAFT" | "ACTIVE" | "ARCHIVED";
  @CreateDateColumn() createdAt!: Date;
}

@Entity("school_academic_terms")
@Index(["academicYearId", "name"], { unique: true })
export class SchoolAcademicTerm {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "varchar", length: 36 }) academicYearId!: string;
  @ManyToOne(() => SchoolAcademicYear, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "academicYearId" })
  academicYear?: SchoolAcademicYear;
  @Column({ length: 120 }) name!: string;
  @Column({ type: "varchar", length: 10 }) startsOn!: string;
  @Column({ type: "varchar", length: 10 }) endsOn!: string;
  @Column({ type: "varchar", length: 16, default: "DRAFT" }) state!:
    "DRAFT" | "ACTIVE" | "ARCHIVED";
  @Column({ type: "boolean", default: false }) correctionOpen!: boolean;
  @CreateDateColumn() createdAt!: Date;
}
