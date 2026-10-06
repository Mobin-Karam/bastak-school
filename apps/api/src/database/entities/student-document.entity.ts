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

export enum DocumentTypeCode {
  SHENASNAME = "SHENASNAME",
  NATIONAL_CARD = "NATIONAL_CARD",
  PARENT_DOCUMENTS = "PARENT_DOCUMENTS",
  PERSONAL_PHOTO = "PERSONAL_PHOTO",
  HEALTH_RECORD = "HEALTH_RECORD",
  VACCINATION_RECORD = "VACCINATION_RECORD",
  INSURANCE_INFO = "INSURANCE_INFO",
  CONSENT_FORMS = "CONSENT_FORMS",
  TRANSPORT_INFO = "TRANSPORT_INFO",
  TUITION_INFO = "TUITION_INFO",
  LEGAL_GUARDIAN_SIGNATURE = "LEGAL_GUARDIAN_SIGNATURE",
}

export enum DocumentStatus {
  PENDING = "PENDING",
  SUBMITTED = "SUBMITTED",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
  NEEDS_CORRECTION = "NEEDS_CORRECTION",
}

@Entity("student_documents")
@Index(["student", "type"], { unique: true })
export class StudentDocument {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Student, { onDelete: "CASCADE" })
  student!: Student;

  @Column({ length: 48 })
  type!: DocumentTypeCode;

  @Column({ length: 255 })
  fileName!: string;

  @Column({ length: 255 })
  fileUrl!: string;

  @Column({ length: 255, nullable: true })
  originalFileName?: string | null;

  @Column({ type: "varchar", length: 32, default: DocumentStatus.PENDING })
  status!: DocumentStatus;

  @Column({ type: "text", nullable: true })
  verificationNote?: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  verifiedBy?: User | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
