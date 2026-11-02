import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Organization } from "./organization.entity";
import { User } from "./user.entity";

/** A server-owned deferral for the academic-cycle setup gate. */
@Entity("schedule_setup_reminders")
@Index("IDX_schedule_setup_reminder_actor_org", [
  "organization",
  "requestedBy",
  "status",
])
export class ScheduleSetupReminder {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @ManyToOne(() => Organization, { nullable: false, onDelete: "CASCADE" })
  organization!: Organization;
  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  requestedBy!: User;
  @Column({ type: "datetime" }) dueAt!: Date;
  @Column({ type: "varchar", length: 16, default: "scheduled" }) status!:
    "scheduled" | "delivered" | "cancelled" | "completed";
  @Column({ type: "datetime", nullable: true }) deliveredAt?: Date | null;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
