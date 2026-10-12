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

@Entity("school_prayer_times")
@Index(["organization", "date"], { unique: true })
export class SchoolPrayerTime {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @ManyToOne(() => Organization, { nullable: false, onDelete: "CASCADE" })
  organization!: Organization;
  /** ISO day in the school's local calendar; blank means the organization default. */
  @Column({ length: 10, default: "" }) date!: string;
  @Column({ length: 5, default: "" }) fajr!: string;
  @Column({ length: 5, default: "" }) sunrise!: string;
  @Column({ length: 5, default: "" }) dhuhr!: string;
  @Column({ length: 5, default: "" }) asr!: string;
  @Column({ length: 5, default: "" }) maghrib!: string;
  @Column({ length: 5, default: "" }) isha!: string;
  @Column({ length: 160, default: "" }) source!: string;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
