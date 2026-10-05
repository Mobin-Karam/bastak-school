import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Organization } from "./organization.entity";
import { Student } from "./student.entity";
import { User } from "./user.entity";

export enum PermissionRequestStatus { PENDING = "PENDING", APPROVED = "APPROVED", REJECTED = "REJECTED" }

@Entity("permission_requests")
export class PermissionRequest {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @ManyToOne(() => Organization, { onDelete: "CASCADE" }) organization!: Organization;
  @Index() @ManyToOne(() => Student, { onDelete: "CASCADE" }) student!: Student;
  @Column({ length: 80 }) kind!: string;
  @Column({ length: 160 }) title!: string;
  @Column({ type: "text" }) details!: string;
  @Column({ type: "datetime", nullable: true }) requestedFor?: Date | null;
  @Column({ type: "varchar", length: 16, default: PermissionRequestStatus.PENDING }) status!: PermissionRequestStatus;
  @Column({ type: "text", default: "" }) supervisorNote!: string;
  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" }) resolvedBy?: User | null;
  @Column({ type: "datetime", nullable: true }) resolvedAt?: Date | null;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
