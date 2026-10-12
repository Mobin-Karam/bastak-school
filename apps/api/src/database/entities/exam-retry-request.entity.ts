import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Exam } from "./exam.entity";
import { Student } from "./student.entity";
import { User } from "./user.entity";

export enum RetryRequestStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}
@Entity("exam_retry_requests")
export class ExamRetryRequest {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index()
  @ManyToOne(() => Exam, { nullable: false, onDelete: "CASCADE" })
  exam!: Exam;
  @Index()
  @ManyToOne(() => Student, { nullable: false, onDelete: "CASCADE" })
  student!: Student;
  @Column({ default: "" }) message!: string;
  @Column({ type: "text", default: RetryRequestStatus.PENDING })
  status!: RetryRequestStatus;
  @Column({ default: "" }) moderatorNote!: string;
  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  resolvedBy?: User | null;
  @Column({ type: "datetime", nullable: true }) resolvedAt?: Date | null;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
