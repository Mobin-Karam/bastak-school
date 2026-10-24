import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";
import { EducationClass } from "./education-class.entity";
import { EducationClassBook } from "./education-class-book.entity";
import { Organization } from "./organization.entity";
import { User } from "./user.entity";

@Entity("school_schedule_entries")
@Index(["organization", "weekday", "startTime"])
export class SchoolScheduleEntry {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @ManyToOne(() => Organization, { nullable: false, onDelete: "CASCADE" })
  organization!: Organization;
  @ManyToOne(() => EducationClass, { nullable: true, onDelete: "SET NULL" })
  classroom?: EducationClass | null;
  @ManyToOne(() => EducationClassBook, { nullable: true, onDelete: "SET NULL" })
  classBook?: EducationClassBook | null;
  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  teacher?: User | null;
  @Column({ length: 160 }) title!: string;
  @Column({ type: "integer" }) weekday!: number;
  @Column({ length: 5 }) startTime!: string;
  @Column({ length: 5 }) endTime!: string;
  @Column({ length: 120, default: "" }) room!: string;
  @Column({ length: 20, default: "ACTIVE" }) status!:
    "ACTIVE" | "ARCHIVED" | "REPLACED";
  @Column({ type: "varchar", length: 36, nullable: true }) versionId!:
    string | null;
  @ManyToOne("TimetableVersion", { nullable: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "versionId" })
  version?: object;
  @Column({ type: "varchar", length: 36, nullable: true }) periodId!:
    string | null;
  @ManyToOne("TimetablePeriod", { nullable: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "periodId" })
  period?: object;
  @Column({ type: "varchar", length: 36, nullable: true }) locationId!:
    string | null;
  @ManyToOne("TimetableLocation", { nullable: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "locationId" })
  location?: object;
  @Column({ type: "varchar", length: 10, nullable: true }) startsOn!:
    string | null;
  @Column({ type: "varchar", length: 10, nullable: true }) endsOn!:
    string | null;
  @Column({ type: "text", default: "" }) notes!: string;
  @Column({ length: 240, default: "" }) classroomNameSnapshot!: string;
  @Column({ length: 240, default: "" }) teacherNameSnapshot!: string;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
