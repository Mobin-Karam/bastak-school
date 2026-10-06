import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Organization } from "./organization.entity";
import { User } from "./user.entity";
import { AttendanceRecord } from "./attendance-record.entity";

export type AttendanceContextType = "class" | "class_group" | "study_group" | "dorm" | "night";

@Entity("attendance_sessions")
export class AttendanceSession {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @ManyToOne(() => Organization, { onDelete: "CASCADE" })
  organization!: Organization;

  @Column({ type: "varchar", length: 24 })
  contextType!: AttendanceContextType;

  @Column({ length: 120 })
  contextId!: string;

  @Column({ type: "datetime" })
  sessionDate!: Date;

  @Column({ type: "text", default: "" })
  note!: string;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  createdBy?: User | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => AttendanceRecord, (record) => record.session)
  records!: AttendanceRecord[];
}
