import { Column, CreateDateColumn, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Student } from "./student.entity";
import { Task } from "./task.entity";

export enum PlanStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}

@Entity("plans")
@Index(["student", "date"], { unique: true })
export class Plan {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Student, (student) => student.plans, { onDelete: "CASCADE" })
  student!: Student;

  @Column({ type: "date" })
  date!: string;

  @Column({ type: "varchar", length: 24, default: PlanStatus.DRAFT })
  status!: PlanStatus;

  @Column({ default: "برنامه روزانه" }) title!: string;
  @Column({ default: "" }) dayLabel!: string;
  @Column({ default: "" }) persianDate!: string;
  @Column({ default: "" }) jalaliId!: string;
  @Column({ length: 600, default: "" }) motivationText!: string;
  /** Immutable source when this plan was created from an organization template. */
  @Index()
  @Column({ type: "varchar", nullable: true }) templateId?: string | null;
  @Column({ type: "integer", nullable: true }) templateVersion?: number | null;

  @CreateDateColumn()
  createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
  @Column({ type: "datetime", nullable: true }) deletedAt?: Date | null;

  @OneToMany(() => Task, (task) => task.plan, { cascade: true })
  tasks!: Task[];
}
