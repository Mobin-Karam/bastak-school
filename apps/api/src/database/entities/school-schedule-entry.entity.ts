import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { EducationClass } from "./education-class.entity";
import { Organization } from "./organization.entity";
import { User } from "./user.entity";

@Entity("school_schedule_entries")
@Index(["organization", "weekday", "startTime"])
export class SchoolScheduleEntry {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @ManyToOne(() => Organization, { onDelete: "CASCADE" }) organization!: Organization;
  @ManyToOne(() => EducationClass, { nullable: true, onDelete: "SET NULL" }) classroom?: EducationClass | null;
  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" }) teacher?: User | null;
  @Column({ length: 160 }) title!: string;
  @Column({ type: "integer" }) weekday!: number;
  @Column({ length: 5 }) startTime!: string;
  @Column({ length: 5 }) endTime!: string;
  @Column({ length: 120, default: "" }) room!: string;
  @Column({ length: 20, default: "ACTIVE" }) status!: "ACTIVE" | "ARCHIVED";
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
