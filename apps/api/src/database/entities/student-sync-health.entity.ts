import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Student } from "./student.entity";

@Entity("student_sync_health")
@Index(["student", "deviceId"], { unique: true })
export class StudentSyncHealth {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @ManyToOne(() => Student, { onDelete: "CASCADE" }) student!: Student;
  @Column({ length: 96 }) deviceId!: string;
  @Column({ length: 16, default: "online" }) status!: "online" | "syncing" | "failed" | "offline";
  @Column({ type: "integer", default: 0 }) pendingCount!: number;
  @Column({ type: "varchar", length: 80, nullable: true }) failureCode?: string | null;
  @Column({ type: "varchar", length: 36, nullable: true }) correlationId?: string | null;
  @Column({ type: "datetime", nullable: true }) lastSuccessfulAt?: Date | null;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
