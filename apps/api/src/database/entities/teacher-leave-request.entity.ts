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
import { User } from "./user.entity";

@Entity("teacher_leave_requests")
@Index(["organizationId", "teacherId", "status"])
export class TeacherLeaveRequest {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "varchar", length: 36 }) organizationId!: string;
  @ManyToOne(() => Organization, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "organizationId" })
  organization?: Organization;
  @Column({ type: "varchar", length: 36 }) teacherId!: string;
  @ManyToOne(() => User, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "teacherId" })
  teacher?: User;
  @Column({ type: "varchar", length: 10 }) startDate!: string;
  @Column({ type: "varchar", length: 10 }) endDate!: string;
  @Column({ type: "text" }) reason!: string;
  @Column({ type: "varchar", length: 16, default: "pending" }) status!:
    "pending" | "approved" | "rejected";
  @Column({ type: "varchar", length: 16, nullable: true }) resolution!:
    "cancel" | "substitute" | null;
  @Column({ type: "varchar", length: 36, nullable: true })
  substituteTeacherId!: string | null;
  @ManyToOne(() => User, { nullable: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "substituteTeacherId" })
  substituteTeacher?: User | null;
  @Column({ type: "varchar", length: 36, nullable: true }) reviewedById!:
    string | null;
  @Column({ type: "datetime", nullable: true }) reviewedAt!: Date | null;
  @CreateDateColumn() createdAt!: Date;
}
