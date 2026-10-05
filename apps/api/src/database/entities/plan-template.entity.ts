import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Organization } from "./organization.entity";
import { User } from "./user.entity";

export type PlanTemplateState = "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED";

@Entity("plan_templates")
@Index(["organization", "state"])
export class PlanTemplate {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @ManyToOne(() => Organization, { onDelete: "CASCADE" }) organization!: Organization;
  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" }) author?: User | null;
  @Column({ length: 180 }) title!: string;
  @Column({ type: "text", default: "" }) description!: string;
  @Column({ type: "varchar", length: 20, default: "DRAFT" }) state!: PlanTemplateState;
  @Column({ default: 1 }) version!: number;
  @Column({ type: "simple-json", default: "[]" }) tags!: string[];
  @Column({ type: "simple-json", default: "[]" }) days!: unknown[];
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
