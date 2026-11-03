import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Organization } from "./organization.entity";
import { User } from "./user.entity";

export type ScheduleSafeguardMode = "MANUAL" | "TEMPLATE_APPLY";
export type ScheduleSafeguardAction =
  | "ENTRY_CREATE"
  | "ENTRY_UPDATE"
  | "ENTRY_ARCHIVE"
  | "ENTRY_DELETE"
  | "TIME_BLOCK_MANAGE"
  | "ACADEMIC_CYCLE_MANAGE"
  | "RECONCILIATION";

/** One persistent organization row makes the active safeguard visible across API processes. */
@Entity("schedule_change_safeguards")
@Index(["organizationId"], { unique: true })
export class ScheduleChangeSafeguard {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "varchar", length: 36 }) organizationId!: string;
  @ManyToOne(() => Organization, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "organizationId" })
  organization!: Organization;
  @Column({ type: "varchar", length: 20 }) mode!: ScheduleSafeguardMode;
  @Column({ type: "varchar", length: 500 }) reason!: string;
  @Column({ type: "varchar", length: 36, nullable: true }) activatedById!:
    string | null;
  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "activatedById" })
  activatedBy?: User | null;
  @Column({ type: "datetime" }) activatedAt!: Date;
  @Column({ type: "datetime" }) expiresAt!: Date;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}

@Entity("schedule_change_safeguard_overrides")
@Index(["organizationId", "action", "expiresAt"])
export class ScheduleChangeSafeguardOverride {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "varchar", length: 36 }) organizationId!: string;
  @ManyToOne(() => Organization, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "organizationId" })
  organization!: Organization;
  @Column({ type: "varchar", length: 32 }) action!: ScheduleSafeguardAction;
  @Column({ type: "varchar", length: 500 }) reason!: string;
  @Column({ type: "varchar", length: 36, nullable: true }) grantedById!:
    string | null;
  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "grantedById" })
  grantedBy?: User | null;
  @Column({ type: "datetime" }) expiresAt!: Date;
  @CreateDateColumn() createdAt!: Date;
}
