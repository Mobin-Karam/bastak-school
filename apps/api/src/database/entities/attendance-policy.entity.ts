import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Organization } from "./organization.entity";

@Entity("attendance_policies")
export class AttendancePolicy {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @OneToOne(() => Organization, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn()
  organization!: Organization;
  @Column({ length: 64, default: "Asia/Tehran" }) timeZone!: string;
  @Column({ length: 5, default: "04:00" }) dayStartsAt!: string;
  @Column({ default: true }) allowPartialSubmission!: boolean;
  @Column({ default: true }) lateCountsAsPresent!: boolean;
  /** When enabled, a correction remains evidence-only until an attendance reviewer approves it. */
  @Column({ default: false }) correctionRequiresReview!: boolean;
  @UpdateDateColumn() updatedAt!: Date;
}
